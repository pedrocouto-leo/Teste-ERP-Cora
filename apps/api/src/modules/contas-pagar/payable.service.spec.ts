import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PayableService } from './payable.service';
import { TaxCalculatorService } from './tax-calculator.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PayableService', () => {
  let service: PayableService;
  let prisma: any;
  let tx: any;

  const validDto = (overrides: Partial<any> = {}) => ({
    supplierId: 's-1',
    titleNumber: 'NF-001',
    issueDate: '2026-05-01',
    dueDate: '2026-06-01',
    originalAmount: 1000,
    costAllocations: [{ costCenterId: 'cc-1', percentage: 100, amount: 1000 }],
    ...overrides,
  });

  beforeEach(async () => {
    tx = {
      payableTitle: {
        create: jest.fn().mockResolvedValue({ id: 't-1' }),
        update: jest.fn().mockResolvedValue({ id: 't-1' }),
      },
      payableCostAllocation: { deleteMany: jest.fn(), createMany: jest.fn() },
      payableTax: { deleteMany: jest.fn(), createMany: jest.fn() },
      payableApproval: { create: jest.fn() },
    };

    prisma = {
      supplier: { findFirst: jest.fn().mockResolvedValue({ id: 's-1', active: true }) },
      payableTitle: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
      payableApproval: { findFirst: jest.fn() },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<unknown>) => cb(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayableService,
        { provide: PrismaService, useValue: prisma },
        { provide: TaxCalculatorService, useValue: {} },
      ],
    }).compile();
    service = module.get<PayableService>(PayableService);
  });

  // Job story principal: lançar título com rateio = 100%
  it('creates a title when rateio totals 100%', async () => {
    await service.create('c-1', validDto() as any, 'u-maker');
    expect(tx.payableTitle.create).toHaveBeenCalled();
  });

  // Regra crítica: rateio ≠ 100% rejeita
  it('rejects rateio that does not sum to 100%', async () => {
    await expect(
      service.create(
        'c-1',
        validDto({
          costAllocations: [
            { costCenterId: 'cc-1', percentage: 60, amount: 600 },
            { costCenterId: 'cc-2', percentage: 30, amount: 300 },
          ],
        }) as any,
        'u-1',
      ),
    ).rejects.toThrow(/100%/);
  });

  // Maker/Checker
  it('blocks creator from approving their own title', async () => {
    prisma.payableTitle.findFirst.mockResolvedValue({
      id: 't-1',
      approvalStatus: 'PENDING',
      createdBy: 'u-1',
      originalAmount: 1000,
      costAllocations: [],
      taxes: [],
      approvals: [],
    });

    await expect(
      service.approve('c-1', 't-1', { action: 'approve' } as any, 'u-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  // Regra: títulos ≥ R$ 100.000 exigem 2 aprovações
  it('requires 2 approvals for titles ≥ R$ 100,000', async () => {
    prisma.payableTitle.findFirst.mockResolvedValue({
      id: 't-1',
      approvalStatus: 'PENDING',
      createdBy: 'u-maker',
      originalAmount: '150000',
      costAllocations: [],
      taxes: [],
      approvals: [],
    });
    prisma.payableApproval.findFirst
      .mockResolvedValueOnce(null) // step lookup -> no prior, this is step 1
      .mockResolvedValueOnce(null); // user hasn't approved yet

    await service.approve('c-1', 't-1', { action: 'approve' } as any, 'u-checker-1');

    expect(tx.payableTitle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ approvalStatus: 'PENDING' }),
      }),
    );
  });

  it('approves at first step for titles < R$ 100,000', async () => {
    prisma.payableTitle.findFirst.mockResolvedValue({
      id: 't-1',
      approvalStatus: 'PENDING',
      createdBy: 'u-maker',
      originalAmount: '5000',
      costAllocations: [],
      taxes: [],
      approvals: [],
    });
    prisma.payableApproval.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await service.approve('c-1', 't-1', { action: 'approve' } as any, 'u-checker');

    expect(tx.payableTitle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          approvalStatus: 'APPROVED',
          approvedBy: 'u-checker',
        }),
      }),
    );
  });

  // Pagamento só em títulos aprovados
  it('rejects payment of non-approved title', async () => {
    prisma.payableTitle.findFirst.mockResolvedValue({
      id: 't-1',
      approvalStatus: 'PENDING',
      status: 'OPEN',
      balance: 1000,
      paidAmount: 0,
      netAmount: 1000,
      costAllocations: [],
      taxes: [],
      approvals: [],
    });

    await expect(
      service.processPayment(
        'c-1',
        't-1',
        { amount: 100, paymentMethod: 'PIX' } as any,
        'u-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
