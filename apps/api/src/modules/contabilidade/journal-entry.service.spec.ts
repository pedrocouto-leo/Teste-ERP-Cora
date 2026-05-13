import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JournalEntryService } from './journal-entry.service';
import { PrismaService } from '../prisma/prisma.service';

describe('JournalEntryService', () => {
  let service: JournalEntryService;
  let prisma: any;

  const openPeriod = {
    id: 'p-1',
    companyId: 'c-1',
    year: 2026,
    month: 5,
    status: 'OPEN',
  };

  const postableAccount = (id: string) => ({
    id,
    code: id,
    name: `Conta ${id}`,
    allowsPosting: true,
    active: true,
  });

  beforeEach(async () => {
    prisma = {
      accountingPeriod: { findFirst: jest.fn() },
      account: { findUnique: jest.fn() },
      journalEntry: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<unknown>) =>
        cb({ journalEntry: { create: jest.fn().mockResolvedValue({ id: 'je-1' }) } }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<JournalEntryService>(JournalEntryService);
  });

  // Job story principal: lançar partida dobrada com débito = crédito
  it('creates a balanced entry in an open period', async () => {
    prisma.accountingPeriod.findFirst.mockResolvedValue(openPeriod);
    prisma.account.findUnique
      .mockResolvedValueOnce(postableAccount('1.1.1'))
      .mockResolvedValueOnce(postableAccount('2.1.1'));
    prisma.journalEntry.findFirst.mockResolvedValue({ entryNumber: 41 });

    const result = await service.create(
      'c-1',
      {
        date: '2026-05-13',
        description: 'Test',
        lines: [
          { accountId: '1.1.1', type: 'DEBIT', amount: 100 },
          { accountId: '2.1.1', type: 'CREDIT', amount: 100 },
        ],
      } as any,
      'u-maker',
    );

    expect(result).toEqual({ id: 'je-1' });
  });

  // Regra crítica: rejeita lançamento desbalanceado
  it('rejects unbalanced debit ≠ credit', async () => {
    prisma.accountingPeriod.findFirst.mockResolvedValue(openPeriod);
    prisma.account.findUnique.mockResolvedValue(postableAccount('1.1.1'));

    await expect(
      service.create(
        'c-1',
        {
          date: '2026-05-13',
          description: 'Test',
          lines: [
            { accountId: '1.1.1', type: 'DEBIT', amount: 100 },
            { accountId: '1.1.1', type: 'CREDIT', amount: 50 },
          ],
        } as any,
        'u-1',
      ),
    ).rejects.toThrow(/desbalanceado/i);
  });

  // Regra crítica: lançar em conta sintética é proibido
  it('rejects entry on synthetic (non-leaf) account', async () => {
    prisma.accountingPeriod.findFirst.mockResolvedValue(openPeriod);
    prisma.account.findUnique.mockResolvedValueOnce({
      ...postableAccount('1.1'),
      allowsPosting: false,
    });

    await expect(
      service.create(
        'c-1',
        {
          date: '2026-05-13',
          description: 'Test',
          lines: [
            { accountId: '1.1', type: 'DEBIT', amount: 10 },
            { accountId: '1.1', type: 'CREDIT', amount: 10 },
          ],
        } as any,
        'u-1',
      ),
    ).rejects.toThrow(/sintetica/i);
  });

  // Regra crítica: período fechado bloqueia novos lançamentos
  it('rejects entry in CLOSED period', async () => {
    prisma.accountingPeriod.findFirst.mockResolvedValue({
      ...openPeriod,
      status: 'CLOSED',
    });

    await expect(
      service.create(
        'c-1',
        {
          date: '2026-05-13',
          description: 'Test',
          lines: [
            { accountId: 'a', type: 'DEBIT', amount: 10 },
            { accountId: 'b', type: 'CREDIT', amount: 10 },
          ],
        } as any,
        'u-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // Maker/Checker: criador não pode aprovar
  it('blocks self-approval (maker/checker)', async () => {
    prisma.journalEntry.findFirst.mockResolvedValue({
      id: 'je-1',
      status: 'PENDING',
      createdBy: 'u-1',
    });

    await expect(
      service.approve('c-1', 'je-1', { action: 'APPROVED' } as any, 'u-1'),
    ).rejects.toThrow(/maker\/checker/i);
  });
});
