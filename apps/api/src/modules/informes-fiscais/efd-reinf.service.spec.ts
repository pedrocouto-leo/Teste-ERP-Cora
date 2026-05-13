import { Test, TestingModule } from '@nestjs/testing';
import { EfdReinfService } from './efd-reinf.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  REINF_TRANSMITTER,
  ReinfTransmitter,
} from './transmitters/reinf-transmitter';

describe('EfdReinfService', () => {
  let service: EfdReinfService;
  let prisma: any;
  let transmitter: jest.Mocked<ReinfTransmitter>;

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn() },
      payableTitle: { findMany: jest.fn() },
      payableTax: { findFirst: jest.fn(), findMany: jest.fn() },
      supplier: { findFirst: jest.fn() },
    };
    transmitter = { transmit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EfdReinfService,
        { provide: PrismaService, useValue: prisma },
        { provide: REINF_TRANSMITTER, useValue: transmitter },
      ],
    }).compile();
    service = module.get<EfdReinfService>(EfdReinfService);
  });

  // Job principal: gerar R-1000 com XML que cita CNPJ da empresa
  it('generates R-1000 XML carrying company CNPJ', async () => {
    prisma.company.findFirst.mockResolvedValue({
      id: 'c-1',
      cnpj: '12345678000199',
      name: 'CORA SCFI',
    });

    const event = await service.generateR1000('c-1');

    expect(event.type).toBe('R-1000');
    expect(event.status).toBe('GENERATED');
    expect(event.xmlContent).toContain('<nrInsc>12345678</nrInsc>');
    expect(event.xmlContent).toContain('<classTrib>99</classTrib>');
    expect(event.xmlContent).toContain('CORA SCFI');
  });

  // Job principal: R-4020 carrega CNPJ do beneficiário PJ e retenções
  it('generates R-4020 for PJ supplier with all withheld taxes', async () => {
    prisma.company.findFirst.mockResolvedValue({
      cnpj: '12345678000199',
      name: 'CORA SCFI',
    });
    prisma.payableTitle.findMany.mockResolvedValue([
      {
        id: 't-1',
        supplierId: 's-1',
        originalAmount: '10000',
        updatedAt: new Date('2026-04-15'),
      },
    ]);
    prisma.payableTax.findMany.mockResolvedValue([
      { taxType: 'IR', amount: '150' },
      { taxType: 'CSLL', amount: '100' },
      { taxType: 'PIS', amount: '65' },
      { taxType: 'COFINS', amount: '300' },
    ]);
    prisma.supplier.findFirst.mockResolvedValue({
      id: 's-1',
      type: 'PJ',
      cpfCnpj: '11222333000181',
      name: 'Fornecedor PJ Ltda',
    });

    const events = await service.generateR4020('c-1', 2026, 4);

    expect(events).toHaveLength(1);
    const xml = events[0].xmlContent;
    expect(xml).toContain('<cnpjBenef>11222333000181</cnpjBenef>');
    expect(xml).toContain('<vlrRendBruto>10000.00</vlrRendBruto>');
    expect(xml).toContain('<vlrIR>150.00</vlrIR>');
    expect(xml).toContain('<vlrCOFINS>300.00</vlrCOFINS>');
    expect(xml).toContain('<perApur>2026-04</perApur>');
  });

  // R-4010 deve filtrar somente PF
  it('skips PJ suppliers when generating R-4010', async () => {
    prisma.company.findFirst.mockResolvedValue({
      cnpj: '12345678000199',
      name: 'CORA',
    });
    prisma.payableTitle.findMany.mockResolvedValue([
      { id: 't-1', supplierId: 's-1', originalAmount: '5000', updatedAt: new Date() },
    ]);
    prisma.payableTax.findFirst.mockResolvedValue({ taxType: 'IR', amount: '75' });
    prisma.supplier.findFirst.mockResolvedValue({
      id: 's-1',
      type: 'PJ',
      cpfCnpj: '11222333000181',
      name: 'PJ',
    });

    const events = await service.generateR4010('c-1', 2026, 4);
    expect(events).toEqual([]);
  });

  // Transmissão delega ao transmitter injetado
  it('transmitEvent delegates to ReinfTransmitter and merges status', async () => {
    transmitter.transmit.mockResolvedValue({
      status: 'ACCEPTED',
      receipt: 'REINF-12345',
      transmittedAt: new Date(),
    });

    const event = {
      id: 'R1000-x',
      type: 'R-1000' as const,
      period: '2026-05',
      status: 'GENERATED' as const,
      xmlContent: '<xml/>',
      generatedAt: new Date(),
    };

    const transmitted = await service.transmitEvent(event);

    expect(transmitter.transmit).toHaveBeenCalledWith({
      eventXml: '<xml/>',
      eventType: 'R-1000',
    });
    expect(transmitted.status).toBe('ACCEPTED');
    expect(transmitted.transmission?.receipt).toBe('REINF-12345');
  });
});
