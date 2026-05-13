import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SettlementService', () => {
  let service: SettlementService;
  let prisma: any;
  let tx: any;

  beforeEach(async () => {
    tx = {
      settlementApproval: { create: jest.fn() },
      settlement: { update: jest.fn().mockResolvedValue({ id: 's-1' }) },
    };
    prisma = {
      settlement: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      settlementApproval: { findFirst: jest.fn() },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<unknown>) => cb(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<SettlementService>(SettlementService);
  });

  // Job story principal: criar liquidação como PENDING com número sequencial
  it('creates a settlement with sequential number as PENDING', async () => {
    prisma.settlement.findFirst.mockResolvedValue({
      settlementNumber: 'LIQ-2026-000041',
    });
    prisma.settlement.create.mockResolvedValue({ id: 's-1' });

    await service.create(
      'c-1',
      {
        type: 'PAYMENT',
        sourceModule: 'contas-pagar',
        sourceId: 't-1',
        amount: 1000,
        date: '2026-05-13',
        description: 'Pagamento NF-001',
      } as any,
      'u-1',
    );

    expect(prisma.settlement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          settlementNumber: 'LIQ-2026-000042',
          status: 'PENDING',
          createdBy: 'u-1',
        }),
      }),
    );
  });

  // Maker/Checker
  it('blocks creator from approving (maker/checker)', async () => {
    prisma.settlement.findFirst.mockResolvedValue({
      id: 's-1',
      status: 'PENDING',
      createdBy: 'u-1',
      amount: 100,
      approvals: [],
    });

    await expect(
      service.approve('c-1', 's-1', { action: 'approve' } as any, 'u-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  // Regra crítica: valores > R$ 500k exigem 2 aprovações
  it('requires 2 approvals when amount > R$ 500,000', async () => {
    prisma.settlement.findFirst.mockResolvedValue({
      id: 's-1',
      status: 'PENDING',
      createdBy: 'u-maker',
      amount: '750000',
      approvals: [],
    });
    prisma.settlementApproval.findFirst
      .mockResolvedValueOnce(null) // user hasn't approved
      .mockResolvedValueOnce(null); // no prior step

    await service.approve('c-1', 's-1', { action: 'approve' } as any, 'u-checker-1');

    // First approver leaves status as PENDING (still needs 1 more)
    expect(tx.settlement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING' }),
      }),
    );
  });

  it('approves on first step when amount ≤ R$ 500,000', async () => {
    prisma.settlement.findFirst.mockResolvedValue({
      id: 's-1',
      status: 'PENDING',
      createdBy: 'u-maker',
      amount: '5000',
      approvals: [],
    });
    prisma.settlementApproval.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await service.approve('c-1', 's-1', { action: 'approve' } as any, 'u-checker');

    expect(tx.settlement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APPROVED',
          approvedBy: 'u-checker',
        }),
      }),
    );
  });

  // Efetivação só após aprovação
  it('rejects settle of non-approved settlement', async () => {
    prisma.settlement.findFirst.mockResolvedValue({
      id: 's-1',
      status: 'PENDING',
      approvals: [],
    });

    await expect(service.settle('c-1', 's-1', 'u-1')).rejects.toThrow(BadRequestException);
  });
});
