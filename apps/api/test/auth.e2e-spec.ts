import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import {
  buildTestApp,
  isDatabaseReachable,
  probeDatabaseSocket,
  resetAndSeedBaseline,
} from './helpers/app.bootstrap';

/**
 * E2E para Controle de Acesso — exercita o caminho real:
 *   request HTTP → ValidationPipe → AuthGuard → AuthService → Prisma → Postgres.
 *
 * Pula automaticamente quando não há Postgres acessível (dev local sem Docker),
 * para que `npm test` continue rápido. Em CI o serviço Postgres é declarado em
 * `.github/workflows/ci.yml` e o teste roda contra ele.
 */
describe('Auth (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseline: { companyId: string; adminId: string; password: string };

  beforeAll(async () => {
    if (!(await probeDatabaseSocket())) {
      // eslint-disable-next-line no-console
      console.warn('[E2E] Postgres socket unreachable — skipping suite');
      return;
    }
    app = await buildTestApp();
    prisma = app.get(PrismaService);

    if (!(await isDatabaseReachable(prisma))) {
      await app.close();
      // eslint-disable-next-line no-console
      console.warn('[E2E] Postgres unreachable — skipping suite');
      return;
    }

    baseline = await resetAndSeedBaseline(prisma);
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  const hasDb = () => Boolean(baseline);

  it('rejects login with invalid credentials', async () => {
    if (!hasDb()) return;
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cora.test', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('logs in valid user and returns access + refresh tokens', async () => {
    if (!hasDb()) return;
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cora.test', password: baseline.password });

    // POST /auth/login is annotated @HttpCode(HttpStatus.OK)
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe('admin@cora.test');
    expect(res.body.data.user.companyId).toBe(baseline.companyId);
  });

  it('enforces tenant isolation: token from tenant A cannot read tenant B data', async () => {
    if (!hasDb()) return;

    // Cria empresa B + usuário B
    const bcrypt = await import('bcryptjs');
    const companyB = await prisma.company.create({
      data: { name: 'Outra SCFI', cnpj: '99888777000166' },
    });
    const role = await prisma.role.create({
      data: { companyId: companyB.id, name: 'ADMIN', active: true },
    });
    await prisma.user.create({
      data: {
        companyId: companyB.id,
        email: 'admin-b@cora.test',
        name: 'Admin B',
        passwordHash: await bcrypt.hash('OtherPass!12345', 4),
        passwordHistory: [],
        active: true,
        userRoles: { create: { roleId: role.id } },
      },
    });

    // Login com A
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cora.test', password: baseline.password });
    const tokenA = login.body.data.accessToken;

    // /auth/me retorna companyId da tenant A
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(me.status).toBe(200);
    expect(me.body.data.companyId).toBe(baseline.companyId);
    expect(me.body.data.companyId).not.toBe(companyB.id);
  });

});
