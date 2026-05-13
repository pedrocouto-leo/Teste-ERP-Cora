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
 * E2E para o lançamento contábil:
 *   - cria plano de contas + contas analíticas + período aberto
 *   - efetua login
 *   - posta um lançamento balanceado (DEBIT == CREDIT)
 *   - confere que aparece em GET /entries
 *
 * Cobre o JOB STORY 3 (Gestão Contábil) — débito = crédito ponta a ponta.
 */
describe('JournalEntry (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseline: { companyId: string; adminId: string; password: string };
  let token: string;
  let debitAccountId: string;
  let creditAccountId: string;

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

    // Plano + contas analíticas
    const chart = await prisma.chartOfAccounts.create({
      data: {
        companyId: baseline.companyId,
        name: 'COSIF',
        version: '1.0',
        validFrom: new Date('2026-01-01'),
        active: true,
      },
    });
    const debit = await prisma.account.create({
      data: {
        chartId: chart.id,
        code: '1.1.1',
        name: 'Caixa',
        level: 3,
        type: 'ASSET',
        nature: 'DEBIT',
        allowsPosting: true,
        active: true,
      },
    });
    const credit = await prisma.account.create({
      data: {
        chartId: chart.id,
        code: '2.1.1',
        name: 'Fornecedores',
        level: 3,
        type: 'LIABILITY',
        nature: 'CREDIT',
        allowsPosting: true,
        active: true,
      },
    });
    debitAccountId = debit.id;
    creditAccountId = credit.id;

    // Período aberto cobrindo a data do lançamento
    await prisma.accountingPeriod.create({
      data: {
        companyId: baseline.companyId,
        year: 2026,
        month: 5,
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-31'),
        status: 'OPEN',
      },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cora.test', password: baseline.password });
    token = login.body.data.accessToken;
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  const hasDb = () => Boolean(baseline);

  it('rejects unbalanced journal entry (debit ≠ credit)', async () => {
    if (!hasDb()) return;
    const res = await request(app.getHttpServer())
      .post('/api/v1/contabilidade/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-05-13',
        description: 'Teste desbalanceado',
        lines: [
          { accountId: debitAccountId, type: 'DEBIT', amount: 100 },
          { accountId: creditAccountId, type: 'CREDIT', amount: 50 },
        ],
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/desbalanceado|diferem/i);
  });

  it('persists a balanced journal entry and lists it', async () => {
    if (!hasDb()) return;

    const created = await request(app.getHttpServer())
      .post('/api/v1/contabilidade/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-05-13',
        description: 'Pagamento à vista',
        lines: [
          { accountId: debitAccountId, type: 'DEBIT', amount: 200 },
          { accountId: creditAccountId, type: 'CREDIT', amount: 200 },
        ],
      });

    expect(created.status).toBe(201);
    const entryId = created.body.data.id;
    expect(entryId).toBeDefined();

    // Listagem
    const list = await request(app.getHttpServer())
      .get('/api/v1/contabilidade/entries')
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    // Service.findAll already returns { data, meta }; TransformInterceptor
    // detects the inner `data` key and passes it through. So the array
    // lives at body.data (not body.data.data).
    const ids = (list.body.data as Array<{ id: string }>).map((e) => e.id);
    expect(ids).toContain(entryId);
  });

});
