import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: { sign: jest.Mock };

  function createPrismaMock() {
    return {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };
  }

  beforeEach(async () => {
    prisma = createPrismaMock();
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // Job story: autenticar usuário com email/senha — retorna access + refresh tokens
  it('logs in a valid user and returns tokens + audit', async () => {
    const passwordHash = await bcrypt.hash('S3nh@Forte!1234', 4);
    prisma.user.findFirst.mockResolvedValue({
      id: 'u-1',
      email: 'admin@cora.com.br',
      name: 'Admin',
      companyId: 'c-1',
      passwordHash,
      passwordHistory: [],
      active: true,
      lockedUntil: null,
      failedAttempts: 0,
      mustChangePass: false,
      userRoles: [{ role: { name: 'ADMIN', active: true } }],
    });
    prisma.user.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});

    const result = await service.login(
      { email: 'admin@cora.com.br', password: 'S3nh@Forte!1234' },
      '127.0.0.1',
      'jest',
    );

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.refreshToken).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.user.roles).toEqual(['ADMIN']);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'LOGIN' }) }),
    );
  });

  // Job secundário: trocar senha respeitando política (histórico de 5)
  it('rejects password reuse from history', async () => {
    const oldHash = await bcrypt.hash('Antig@Senha!1', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      passwordHash: oldHash,
      passwordHistory: [oldHash],
    });

    await expect(
      service.changePassword('u-1', {
        currentPassword: 'Antig@Senha!1',
        newPassword: 'Antig@Senha!1',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  // Job secundário: lockout após 5 tentativas
  it('locks account after 5 failed attempts', async () => {
    const passwordHash = await bcrypt.hash('correct', 4);
    prisma.user.findFirst.mockResolvedValue({
      id: 'u-1',
      email: 'u@x.com',
      companyId: 'c-1',
      passwordHash,
      passwordHistory: [],
      active: true,
      lockedUntil: null,
      failedAttempts: 4,
      userRoles: [],
    });

    await expect(
      service.login({ email: 'u@x.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      }),
    );
  });
});
