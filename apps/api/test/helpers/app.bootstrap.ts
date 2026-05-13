import * as net from 'net';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { CorrelationIdInterceptor } from '../../src/common/interceptors/correlation-id.interceptor';
import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

/**
 * Tries a quick TCP connect to the configured Postgres before the Nest app
 * boots — Prisma's `onModuleInit` crashes hard on connection failure, so we
 * gate the heavier bootstrap behind a fast pre-check.
 */
export async function probeDatabaseSocket(timeoutMs = 1500): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname;
    const port = Number(u.port || '5432');
    return await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      const timer = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, timeoutMs);
      socket.once('connect', () => {
        clearTimeout(timer);
        socket.end();
        resolve(true);
      });
      socket.once('error', () => {
        clearTimeout(timer);
        resolve(false);
      });
      socket.connect(port, host);
    });
  } catch {
    return false;
  }
}

/**
 * Bootstrap an in-memory test app matching the production wiring of main.ts.
 * Caller is responsible for `app.close()`.
 */
export async function buildTestApp(): Promise<INestApplication> {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new CorrelationIdInterceptor(),
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );
  await app.init();
  return app;
}

/**
 * Probe the database via Prisma. Returns true if reachable, false otherwise.
 * Used to skip E2E tests when developers run them locally without Postgres.
 */
export async function isDatabaseReachable(prisma: PrismaService): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Wipe all tenant data and reseed a baseline state for one company + admin user.
 * Returns the IDs for tests to reference.
 */
export async function resetAndSeedBaseline(prisma: PrismaService) {
  const bcrypt = await import('bcryptjs');

  // Truncate in FK-safe order
  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.journalEntryLine.deleteMany();
    await tx.journalEntry.deleteMany();
    await tx.accountBalance.deleteMany();
    await tx.account.deleteMany();
    await tx.chartOfAccounts.deleteMany();
    await tx.accountingPeriod.deleteMany();
    await tx.rolePermission.deleteMany();
    await tx.userRole.deleteMany();
    await tx.userAuthorityLimit.deleteMany();
    await tx.user.deleteMany();
    await tx.role.deleteMany();
    await tx.permission.deleteMany();
    await tx.branch.deleteMany();
    await tx.company.deleteMany();
  });

  const company = await prisma.company.create({
    data: {
      name: 'CORA SCFI (E2E)',
      tradeName: 'CORA',
      cnpj: '12345678000199',
    },
  });

  const role = await prisma.role.create({
    data: { companyId: company.id, name: 'ADMIN', active: true },
  });

  const password = 'TestPass!12345';
  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'admin@cora.test',
      name: 'Admin E2E',
      passwordHash: await bcrypt.hash(password, 4),
      passwordHistory: [],
      active: true,
      userRoles: { create: { roleId: role.id } },
    },
  });

  return { companyId: company.id, adminId: admin.id, password };
}
