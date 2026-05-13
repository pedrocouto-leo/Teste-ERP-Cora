import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { CashMovementService } from './cash-movement.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CashMovementService', () => {
  let service: CashMovementService;
  let prisma: any;
  let txCalls: { cashAccount: any; cashMovement: any };

  beforeEach(async () => {
    txCalls = {
      cashAccount: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      cashMovement: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    prisma = {
      cashAccount: { findFirst: jest.fn() },
      cashMovement: { findFirst: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<unknown>) => cb(txCalls)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashMovementService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<CashMovementService>(CashMovementService);
  });

  // Job story principal: registrar movimentação com atualização atômica de saldo
  it('updates balance atomically when crediting an account', async () => {
    prisma.cashAccount.findFirst.mockResolvedValue({
      id: 'a-1',
      active: true,
      balance: new Decimal(100),
    });
    txCalls.cashAccount.findUnique.mockResolvedValue({
      id: 'a-1',
      balance: new Decimal(100),
    });
    txCalls.cashMovement.create.mockResolvedValue({ id: 'm-1' });

    await service.create(
      'c-1',
      {
        cashAccountId: 'a-1',
        date: '2026-05-13',
        type: 'CREDIT',
        amount: 50,
        description: 'depósito',
        category: 'DEPOSIT',
      } as any,
      'u-1',
    );

    expect(txCalls.cashAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ balance: new Decimal(150) }),
      }),
    );
  });

  // Job story principal: transferência cria par DEBIT + CREDIT vinculado
  it('transfer creates a linked debit/credit pair', async () => {
    prisma.cashAccount.findFirst
      .mockResolvedValueOnce({ id: 'from', active: true, balance: new Decimal(1000), name: 'Origem' })
      .mockResolvedValueOnce({ id: 'to', active: true, balance: new Decimal(0), name: 'Destino' });

    txCalls.cashAccount.findUnique
      .mockResolvedValueOnce({ id: 'from', balance: new Decimal(1000) })
      .mockResolvedValueOnce({ id: 'to', balance: new Decimal(0) });

    txCalls.cashMovement.create
      .mockResolvedValueOnce({ id: 'debit-1' })
      .mockResolvedValueOnce({ id: 'credit-1' });

    const result = await service.transfer(
      'c-1',
      {
        fromAccountId: 'from',
        toAccountId: 'to',
        amount: 200,
        date: '2026-05-13',
        description: 'rebalanceamento',
      } as any,
      'u-1',
    );

    expect(result).toEqual({ debit: { id: 'debit-1' }, credit: { id: 'credit-1' } });
    // Source debited
    expect(txCalls.cashAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'from' },
        data: { balance: new Decimal(800) },
      }),
    );
    // Destination credited
    expect(txCalls.cashAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'to' },
        data: { balance: new Decimal(200) },
      }),
    );
    // Movements linked (debit gets sourceId -> credit)
    expect(txCalls.cashMovement.update).toHaveBeenCalledWith({
      where: { id: 'debit-1' },
      data: { sourceId: 'credit-1' },
    });
  });

  // Regra: origem ≠ destino
  it('rejects transfer to same account', async () => {
    await expect(
      service.transfer(
        'c-1',
        { fromAccountId: 'a', toAccountId: 'a', amount: 10, date: '2026-05-13', description: '' } as any,
        'u-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
