import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ContractService } from './contract.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContractService', () => {
  let service: ContractService;
  let prisma: any;
  let tx: any;

  beforeEach(async () => {
    tx = {
      contract: { create: jest.fn().mockResolvedValue({ id: 'k-1', installments: [] }) },
    };

    prisma = {
      supplier: { findFirst: jest.fn().mockResolvedValue({ id: 's-1', active: true }) },
      contract: { findFirst: jest.fn() },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<unknown>) => cb(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ContractService>(ContractService);
  });

  // Job story principal: gerar parcelas automaticamente para contrato FIXED
  it('auto-generates 12 monthly installments for a 1-year FIXED contract', async () => {
    await service.create(
      'c-1',
      {
        contractNumber: 'CT-2026-001',
        supplierId: 's-1',
        type: 'FIXED',
        description: 'Aluguel anual',
        totalValue: 120000,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      } as any,
      'u-1',
    );

    const createArgs = tx.contract.create.mock.calls[0][0];
    expect(createArgs.data.installments.createMany.data).toHaveLength(12);
    // Total amount should sum to totalValue
    const sum = createArgs.data.installments.createMany.data.reduce(
      (s: number, inst: { amount: number }) => s + inst.amount,
      0,
    );
    expect(Math.round(sum)).toBe(120000);
  });

  // Regra: FIXED sem endDate é inválido
  it('rejects FIXED contract without endDate', async () => {
    await expect(
      service.create(
        'c-1',
        {
          contractNumber: 'CT-002',
          supplierId: 's-1',
          type: 'FIXED',
          description: 'x',
          totalValue: 1000,
          startDate: '2026-01-01',
        } as any,
        'u-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // Job secundário: parcelas manuais respeitadas
  it('uses provided installments when supplied', async () => {
    await service.create(
      'c-1',
      {
        contractNumber: 'CT-003',
        supplierId: 's-1',
        type: 'VARIABLE',
        description: 'Variável',
        totalValue: 500,
        startDate: '2026-01-01',
        installments: [
          { dueDate: '2026-03-01', amount: 200 },
          { dueDate: '2026-06-01', amount: 300 },
        ],
      } as any,
      'u-1',
    );

    const createArgs = tx.contract.create.mock.calls[0][0];
    expect(createArgs.data.installments.createMany.data).toEqual([
      { number: 1, dueDate: new Date('2026-03-01'), amount: 200 },
      { number: 2, dueDate: new Date('2026-06-01'), amount: 300 },
    ]);
  });

  // Maker/Checker on approve
  it('blocks self-approval', async () => {
    prisma.contract.findFirst.mockResolvedValue({
      id: 'k-1',
      approvalStatus: 'PENDING',
      createdBy: 'u-1',
      installments: [],
      addendums: [],
    });

    await expect(service.approve('c-1', 'k-1', 'approve', 'u-1')).rejects.toThrow(
      /Maker\/Checker/,
    );
  });
});
