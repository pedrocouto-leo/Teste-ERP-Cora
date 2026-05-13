import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      budget: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
      budgetLine: { count: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<BudgetService>(BudgetService);
  });

  // Job story principal: criar orçamento por empresa/ano (versionado)
  it('creates first budget version as DRAFT', async () => {
    prisma.budget.findFirst.mockResolvedValue(null);
    prisma.budget.create.mockResolvedValue({ id: 'b-1', version: 1 });

    await service.create('c-1', { name: '2026', year: 2026 } as any, 'u-1');

    expect(prisma.budget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: 1,
          status: 'DRAFT',
          createdBy: 'u-1',
        }),
      }),
    );
  });

  it('increments version when prior budgets exist', async () => {
    prisma.budget.findFirst.mockResolvedValue({ version: 3 });
    prisma.budget.create.mockResolvedValue({ id: 'b-1', version: 4 });

    await service.create('c-1', { name: '2026', year: 2026 } as any, 'u-1');

    expect(prisma.budget.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ version: 4 }) }),
    );
  });

  // Maker/Checker
  it('blocks self-approval (maker/checker)', async () => {
    prisma.budget.findFirst.mockResolvedValue({
      id: 'b-1',
      status: 'DRAFT',
      createdBy: 'u-1',
    });

    await expect(
      service.approve('c-1', 'b-1', { action: 'approve' } as any, 'u-1'),
    ).rejects.toThrow(/maker\/checker/i);
  });

  // Regra: orçamento sem linhas não pode ser aprovado
  it('rejects approval of empty budget', async () => {
    prisma.budget.findFirst.mockResolvedValue({
      id: 'b-1',
      status: 'DRAFT',
      createdBy: 'u-1',
    });
    prisma.budgetLine.count.mockResolvedValue(0);

    await expect(
      service.approve('c-1', 'b-1', { action: 'approve' } as any, 'u-2'),
    ).rejects.toThrow(/pelo menos uma linha/);
  });

  // Ativação só de orçamentos aprovados
  it('rejects activation of DRAFT budget', async () => {
    prisma.budget.findFirst.mockResolvedValue({
      id: 'b-1',
      status: 'DRAFT',
    });

    await expect(service.activate('c-1', 'b-1')).rejects.toThrow(BadRequestException);
  });
});
