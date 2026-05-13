import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EfdContribuicoesService } from './efd-contribuicoes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EfdContribuicoesService', () => {
  let service: EfdContribuicoesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      company: { findFirst: jest.fn() },
      invoice: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EfdContribuicoesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<EfdContribuicoesService>(EfdContribuicoesService);
  });

  // Job principal: gerar escrituração com totais agregados PIS/COFINS
  it('aggregates PIS and COFINS across invoices for the period', async () => {
    prisma.company.findFirst.mockResolvedValue({ cnpj: '12345678000199', name: 'CORA' });
    prisma.invoice.findMany.mockResolvedValue([
      {
        invoiceNumber: 'FAT-001',
        issueDate: new Date('2026-04-05'),
        totalAmount: '10500',
        subtotal: '10000',
        taxes: [
          { taxType: 'PIS', amount: '65' },
          { taxType: 'COFINS', amount: '300' },
        ],
      },
      {
        invoiceNumber: 'FAT-002',
        issueDate: new Date('2026-04-20'),
        totalAmount: '5250',
        subtotal: '5000',
        taxes: [
          { taxType: 'PIS', amount: '32.50' },
          { taxType: 'COFINS', amount: '150' },
        ],
      },
    ]);

    const result = await service.generate('c-1', 2026, 4);

    expect(result.blocks.blockM.pisApurado).toBeCloseTo(97.5, 2);
    expect(result.blocks.blockM.cofinsApurado).toBeCloseTo(450, 2);
    expect(result.docs).toHaveLength(2);
    expect(result.period).toBe('2026-04');
  });

  // Job secundário: exportar arquivo SPED em texto pipe-delimited
  it('exports SPED file with all expected block opener/closer records', async () => {
    prisma.company.findFirst.mockResolvedValue({ cnpj: '12345678000199', name: 'CORA SCFI' });
    prisma.invoice.findMany.mockResolvedValue([
      {
        invoiceNumber: 'FAT-001',
        issueDate: new Date('2026-04-15'),
        totalAmount: '10000',
        subtotal: '10000',
        taxes: [
          { taxType: 'PIS', amount: '65' },
          { taxType: 'COFINS', amount: '300' },
        ],
      },
    ]);

    const file = await service.exportFile('c-1', 2026, 4);

    // header e fechamento
    expect(file).toContain('|0000|015|0|');
    expect(file).toContain('CORA SCFI');
    expect(file).toContain('12345678000199');
    // blocos
    expect(file).toContain('|0001|0|');
    expect(file).toContain('|A001|0|');
    expect(file).toContain('|A100|');
    expect(file).toContain('|A170|');
    expect(file).toContain('|M001|0|');
    expect(file).toContain('|M200|');
    expect(file).toContain('|M600|');
    // total da apuração presente no arquivo (vírgula como separador decimal)
    expect(file).toContain('65,00');
    expect(file).toContain('300,00');
    // contagem final
    expect(file).toMatch(/\|9999\|\d+\|$/);
  });

  it('rejects generation for unknown company', async () => {
    prisma.company.findFirst.mockResolvedValue(null);
    await expect(service.exportFile('c-x', 2026, 4)).rejects.toThrow(BadRequestException);
  });

  it('exports empty-block file when no invoices in the period', async () => {
    prisma.company.findFirst.mockResolvedValue({ cnpj: '12345678000199', name: 'CORA' });
    prisma.invoice.findMany.mockResolvedValue([]);

    const file = await service.exportFile('c-1', 2026, 4);

    // bloco A com indicador "1" (sem dados)
    expect(file).toContain('|A001|1|');
    expect(file).toContain('|M001|1|');
  });
});
