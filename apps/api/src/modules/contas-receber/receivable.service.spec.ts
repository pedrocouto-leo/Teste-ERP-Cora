import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { ReceivableService } from './receivable.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReceivableService', () => {
  let service: ReceivableService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      client: { findFirst: jest.fn() },
      receivableTitle: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceivableService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ReceivableService>(ReceivableService);
  });

  // Job story principal: lançar título a receber para cliente válido
  it('creates receivable title for valid client', async () => {
    prisma.client.findFirst.mockResolvedValue({ id: 'cl-1' });
    prisma.receivableTitle.create.mockResolvedValue({ id: 'rt-1' });

    await service.create(
      'c-1',
      {
        clientId: 'cl-1',
        titleNumber: 'DUP-001',
        issueDate: '2026-05-01',
        dueDate: '2026-06-01',
        originalAmount: 5000,
      } as any,
      'u-1',
    );

    expect(prisma.receivableTitle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'c-1',
          clientId: 'cl-1',
          createdBy: 'u-1',
        }),
      }),
    );
  });

  it('rejects creation for client outside tenant', async () => {
    prisma.client.findFirst.mockResolvedValue(null);

    await expect(
      service.create(
        'c-1',
        {
          clientId: 'other-tenant',
          titleNumber: 'DUP-001',
          issueDate: '2026-05-01',
          dueDate: '2026-06-01',
          originalAmount: 100,
        } as any,
        'u-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // Job secundário: recebimento parcial muda status para PARTIAL
  it('marks title PARTIAL on partial payment', async () => {
    prisma.receivableTitle.findFirst.mockResolvedValue({
      id: 'rt-1',
      status: 'OPEN',
      balance: new Decimal(1000),
      receivedAmount: new Decimal(0),
      boletos: [],
      negotiations: [],
    });
    prisma.receivableTitle.update.mockResolvedValue({ id: 'rt-1' });

    await service.receivePayment('c-1', 'rt-1', { amount: 400 } as any, 'u-1');

    expect(prisma.receivableTitle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PARTIAL',
          receivedAmount: new Decimal(400),
          balance: new Decimal(600),
        }),
      }),
    );
  });

  // Job secundário: recebimento integral marca PAID
  it('marks title PAID when balance reaches zero', async () => {
    prisma.receivableTitle.findFirst.mockResolvedValue({
      id: 'rt-1',
      status: 'PARTIAL',
      balance: new Decimal(600),
      receivedAmount: new Decimal(400),
      boletos: [],
      negotiations: [],
    });
    prisma.receivableTitle.update.mockResolvedValue({ id: 'rt-1' });

    await service.receivePayment('c-1', 'rt-1', { amount: 600 } as any, 'u-1');

    expect(prisma.receivableTitle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PAID',
          balance: new Decimal(0),
        }),
      }),
    );
  });

  // Regra: não pode receber mais que o saldo
  it('rejects overpayment exceeding balance', async () => {
    prisma.receivableTitle.findFirst.mockResolvedValue({
      id: 'rt-1',
      status: 'OPEN',
      balance: new Decimal(100),
      receivedAmount: new Decimal(0),
      boletos: [],
      negotiations: [],
    });

    await expect(
      service.receivePayment('c-1', 'rt-1', { amount: 200 } as any, 'u-1'),
    ).rejects.toThrow(/excede o saldo/);
  });
});
