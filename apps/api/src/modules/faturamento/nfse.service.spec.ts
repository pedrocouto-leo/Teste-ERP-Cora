import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NfseService } from './nfse.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NFSE_TRANSMITTER,
  NfseTransmitter,
} from './transmitters/nfse-transmitter';

describe('NfseService', () => {
  let service: NfseService;
  let prisma: any;
  let transmitter: jest.Mocked<NfseTransmitter>;

  const baseInvoice = {
    id: 'inv-1',
    invoiceNumber: 'FAT-000001',
    clientId: 'cl-1',
    issueDate: new Date('2026-05-13'),
    description: 'Consultoria — abril/2026',
    subtotal: '10000',
    totalAmount: '10500',
    status: 'ISSUED',
    nfseStatus: null as string | null,
    nfseNumber: null as string | null,
    items: [
      {
        sequence: 1,
        description: 'Consultoria',
        serviceCode: '17.01',
        quantity: '10',
        unitPrice: '1000',
        totalPrice: '10000',
      },
    ],
    taxes: [
      { taxType: 'ISS', baseAmount: '10000', rate: '5', amount: '500', withheld: false },
      { taxType: 'IR', baseAmount: '10000', rate: '1.5', amount: '150', withheld: true },
    ],
  };

  beforeEach(async () => {
    prisma = {
      invoice: { findFirst: jest.fn(), update: jest.fn() },
      client: { findFirst: jest.fn() },
      company: { findFirst: jest.fn() },
    };
    transmitter = {
      transmit: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NfseService,
        { provide: PrismaService, useValue: prisma },
        { provide: NFSE_TRANSMITTER, useValue: transmitter },
      ],
    }).compile();
    service = module.get<NfseService>(NfseService);
  });

  // Job story principal: emitir NFS-e gera XML ABRASF e transmite
  it('emits NFS-e: builds XML, transmits, persists nfseNumber', async () => {
    prisma.invoice.findFirst.mockResolvedValue(baseInvoice);
    prisma.client.findFirst.mockResolvedValue({
      id: 'cl-1',
      cpfCnpj: '11222333000181',
      name: 'Cliente Exemplo Ltda',
      email: 'fin@cliente.com.br',
    });
    prisma.company.findFirst.mockResolvedValue({
      id: 'c-1',
      cnpj: '12345678000199',
      name: 'CORA SCFI',
    });
    transmitter.transmit.mockResolvedValue({
      status: 'ACCEPTED',
      nfseNumber: 'NFSE-2026-001',
      protocol: 'PROT-1',
      transmittedAt: new Date(),
    });
    prisma.invoice.update.mockResolvedValue({ ...baseInvoice, nfseStatus: 'EMITTED' });

    const result = await service.emitNfse('c-1', 'inv-1', 'u-1');

    expect(transmitter.transmit).toHaveBeenCalledWith(
      expect.objectContaining({
        rpsXml: expect.stringContaining('<EnviarLoteRpsEnvio'),
        cityCode: expect.any(String),
      }),
    );
    // XML must include the provider's CNPJ digits and the client doc
    const xml = transmitter.transmit.mock.calls[0][0].rpsXml;
    expect(xml).toContain('<Cnpj>12345678000199</Cnpj>');
    expect(xml).toContain('11222333000181');
    expect(xml).toContain('<ValorServicos>10000.00</ValorServicos>');
    expect(xml).toContain('<ValorIss>500.00</ValorIss>');

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nfseStatus: 'EMITTED',
          nfseNumber: 'NFSE-2026-001',
        }),
      }),
    );
    expect(result.transmission.status).toBe('ACCEPTED');
  });

  it('rejects emission of DRAFT invoice', async () => {
    prisma.invoice.findFirst.mockResolvedValue({ ...baseInvoice, status: 'DRAFT' });
    await expect(service.emitNfse('c-1', 'inv-1', 'u-1')).rejects.toThrow(BadRequestException);
  });

  it('rejects re-emission of already-EMITTED invoice', async () => {
    prisma.invoice.findFirst.mockResolvedValue({ ...baseInvoice, nfseStatus: 'EMITTED' });
    await expect(service.emitNfse('c-1', 'inv-1', 'u-1')).rejects.toThrow(BadRequestException);
  });

  // Job secundário: cancelamento
  it('cancels emitted NFS-e via transmitter', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      ...baseInvoice,
      nfseStatus: 'EMITTED',
      nfseNumber: 'NFSE-2026-001',
    });
    transmitter.cancel.mockResolvedValue({
      status: 'ACCEPTED',
      protocol: 'CANCEL-1',
      cancelledAt: new Date(),
    });
    prisma.invoice.update.mockResolvedValue({ ...baseInvoice, nfseStatus: 'CANCELLED' });

    await service.cancelNfse('c-1', 'inv-1', 'u-1');

    expect(transmitter.cancel).toHaveBeenCalledWith(
      expect.objectContaining({ nfseNumber: 'NFSE-2026-001' }),
    );
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nfseStatus: 'CANCELLED' }),
      }),
    );
  });

  it('rejects cancel when invoice has no nfseNumber', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      ...baseInvoice,
      nfseStatus: 'PENDING',
      nfseNumber: null,
    });

    await expect(service.cancelNfse('c-1', 'inv-1', 'u-1')).rejects.toThrow(BadRequestException);
  });

  it('rejects cancel when invoice does not exist', async () => {
    prisma.invoice.findFirst.mockResolvedValue(null);
    await expect(service.cancelNfse('c-1', 'missing', 'u-1')).rejects.toThrow(NotFoundException);
  });
});
