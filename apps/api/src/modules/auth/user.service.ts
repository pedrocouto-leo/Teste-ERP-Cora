import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateUserDto, createdBy: string) {
    const existing = await this.prisma.user.findFirst({
      where: { companyId, email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        companyId,
        email: dto.email,
        name: dto.name,
        passwordHash,
        active: dto.active ?? true,
        createdBy,
        userRoles: dto.roleIds
          ? {
              create: dto.roleIds.map((roleId) => ({ roleId })),
            }
          : undefined,
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    return this.sanitizeUser(user);
  }

  async findAll(companyId: string, pagination: PaginationDto, search?: string) {
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          userRoles: { include: { role: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(this.sanitizeUser),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.sanitizeUser(user);
  }

  async update(companyId: string, id: string, dto: UpdateUserDto, updatedBy: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: { companyId, email: dto.email, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
    }

    // Update roles if provided
    if (dto.roleIds) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      await this.prisma.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
      });
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
        active: dto.active,
        updatedBy,
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    return this.sanitizeUser(updated);
  }

  async delete(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash, passwordHistory, ...rest } = user as Record<string, unknown>;
    return rest;
  }
}
