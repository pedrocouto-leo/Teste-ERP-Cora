import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { v4 as uuidv4 } from 'uuid';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;
  private readonly PASSWORD_HISTORY_SIZE = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: {
        userRoles: {
          include: { role: true },
          where: { role: { active: true } },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        `Conta bloqueada até ${user.lockedUntil.toLocaleString('pt-BR')}`,
      );
    }

    if (!user.active) {
      throw new ForbiddenException('Conta desativada');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      const failedAttempts = user.failedAttempts + 1;
      const updateData: Record<string, unknown> = { failedAttempts };

      if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + this.LOCK_DURATION_MINUTES);
        updateData.lockedUntil = lockUntil;
        this.logger.warn(`Account locked for user ${user.email}`);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Reset failed attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.companyId, roles);

    // Save refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: 'LOGIN',
        resource: 'auth',
        ip: ip || null,
        userAgent: userAgent?.substring(0, 500) || null,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: user.companyId,
        roles,
        mustChangePass: user.mustChangePass,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: { role: true },
              where: { role: { active: true } },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de refresh inválido ou expirado');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = storedToken.user;
    const roles = user.userRoles.map((ur) => ur.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.companyId, roles);

    // Create new refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId: (await this.prisma.user.findUnique({ where: { id: userId } }))!.companyId,
        userId,
        action: 'LOGOUT',
        resource: 'auth',
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { select: { id: true, name: true, tradeName: true } },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
          where: { role: { active: true } },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map(
            (rp) => `${rp.permission.resource}:${rp.permission.action}`,
          ),
        ),
      ),
    ];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
      company: user.company,
      roles,
      permissions,
      mustChangePass: user.mustChangePass,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    // Check password history
    for (const oldHash of user.passwordHistory) {
      if (await bcrypt.compare(dto.newPassword, oldHash)) {
        throw new ForbiddenException(
          `A nova senha não pode ser igual às últimas ${this.PASSWORD_HISTORY_SIZE} senhas`,
        );
      }
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    const history = [user.passwordHash, ...user.passwordHistory].slice(
      0,
      this.PASSWORD_HISTORY_SIZE,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        passwordHistory: history,
        mustChangePass: false,
      },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    companyId: string,
    roles: string[],
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      companyId,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();

    return { accessToken, refreshToken };
  }
}
