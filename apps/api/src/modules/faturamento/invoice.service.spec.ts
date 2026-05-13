import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let prisma: any;
  let tx: any;

  beforeEach(async () => {
    tx = {
      invoice: { create: jest.fn(), update: jest.fn().mockResolvedValue({ id: 'inv-1' }) },
      invoiceItem: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
      invoiceTax: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
      receivableTitle: { create: jest.fn().mockResolvedValue({ id: 'rt-1' }) },
    };

    prisma = {
      client: { findFirst: jest.fn().mockResolvedValue({ id: 'cl-1' }) },
      invoice: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<unknown>) => cb(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<InvoiceService>(InvoiceService);
  });

  // Job story principal: criar fatura com cálculo de subtotal e impostos retidos
  it('computes subtotal and totals with withheld taxes', async () => {
    tx.invoice.create.mockResolvedValue({ id: 'inv-1' });

    await service.create(
      'c-1',
      {
        clientId: 'cl-1',
        issueDate: '2026-05-01',
        dueDate: '2026-06-01',
        items: [
          { description: 'Consultoria', quantity: 10, unitPrice: 1000 },
        ],
        taxes: [
          { taxType: 'ISS', baseAmount: 10000, rate: 5, withheld: false },
          { taxType: 'IR', baseAmount: 10000, rate: 1.5, withheld: true },
        ],
      } as any,
      'u-1',
    );

    const createArgs = tx.invoice.create.mock.calls[0][0];
    expect(createArgs.data.subtotal).toEqual(new Decimal(10000));
    // taxTotal = ISS (500) + IR (150) = 650
    expect(createArgs.data.taxTotal).toEqual(new Decimal(650));
    // total = subtotal + taxTotal - withheld = 10000 + 650 - 150 = 10500
    expect(createArgs.data.totalAmount).toEqual(new Decimal(10500));
  });

  // Job secundário: emit gera ReceivableTitle vinculado
  it('issue creates linked receivable and transitions to ISSUED', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'inv-1',
      status: 'DRAFT',
      clientId: 'cl-1',
      invoiceNumber: 'FAT-000001',
      issueDate: new Date('2026-05-01'),
      dueDate: new Date('2026-06-01'),
      totalAmount: new Decimal(10500),
      currencyCode: 'BRL',
      receivableId: null,
      items: [{ id: 'i-1' }],
      taxes: [],
    });

    await service.issue('c-1', 'inv-1', 'u-1');

    expect(tx.receivableTitle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'FATURAMENTO',
          sourceId: 'inv-1',
          titleNumber: 'FAT-000001',
        }),
      }),
    );
    expect(tx.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ISSUED',
          receivableId: 'rt-1',
        }),
      }),
    );
  });

  // Regra: emit requer ao menos 1 item
  it('rejects issue of invoice without items', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'inv-1',
      status: 'DRAFT',
      items: [],
      taxes: [],
    });

    await expect(service.issue('c-1', 'inv-1', 'u-1')).rejects.toThrow(BadRequestException);
  });

  // Regra: somente DRAFT pode ser emitida
  it('rejects issue of already-issued invoice', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'inv-1',
      status: 'ISSUED',
      items: [{ id: 'i-1' }],
      taxes: [],
    });

    await expect(service.issue('c-1', 'inv-1', 'u-1')).rejects.toThrow(BadRequestException);
  });
});
