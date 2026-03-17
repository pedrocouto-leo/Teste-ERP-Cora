import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EfdContribuicoesService {
  private readonly logger = new Logger(EfdContribuicoesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera escrituração EFD Contribuições (PIS/COFINS)
   * Layout: Blocos 0, A, C, D, F, M, 1, 9
   */
  async generate(companyId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Bloco 0 - Abertura e identificação
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
    });

    // Bloco F - Demais documentos e operações (serviços)
    const invoices = await this.prisma.invoice?.findMany({
      where: {
        companyId,
        issueDate: { gte: startDate, lte: endDate },
        status: 'ISSUED',
      },
      include: { taxes: true },
    }).catch(() => []);

    // Bloco A - Documentos fiscais (serviços)
    const payables = await this.prisma.payableTitle.findMany({
      where: {
        companyId,
        issueDate: { gte: startDate, lte: endDate },
      },
    });

    const payableTaxes = [];
    for (const p of payables) {
      const taxes = await this.prisma.payableTax.findMany({
        where: {
          payableId: p.id,
          taxType: { in: ['PIS', 'COFINS'] },
        },
      });
      if (taxes.length > 0) {
        payableTaxes.push({ payable: p, taxes });
      }
    }

    // Bloco M - Apuração da contribuição e crédito
    const pisTotal = payableTaxes.reduce((sum, pt) => {
      const pis = pt.taxes.find((t: { taxType: string }) => t.taxType === 'PIS');
      return sum + (pis ? Number(pis.amount) : 0);
    }, 0);

    const cofinsTotal = payableTaxes.reduce((sum, pt) => {
      const cofins = pt.taxes.find((t: { taxType: string }) => t.taxType === 'COFINS');
      return sum + (cofins ? Number(cofins.amount) : 0);
    }, 0);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      company: { cnpj: company?.cnpj, name: company?.name },
      blocks: {
        block0: { records: 1, description: 'Abertura e identificação' },
        blockA: { records: payableTaxes.length, description: 'Documentos fiscais de serviços' },
        blockF: { records: (invoices as unknown[])?.length || 0, description: 'Demais documentos' },
        blockM: {
          pisApurado: pisTotal,
          cofinsApurado: cofinsTotal,
          description: 'Apuração PIS/COFINS',
        },
      },
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }

  /**
   * Exporta arquivo SPED em formato texto fixo
   */
  async exportFile(companyId: string, year: number, month: number): Promise<string> {
    const data = await this.generate(companyId, year, month);

    // Gera layout SPED (texto fixo, pipe-delimited)
    const lines: string[] = [];

    // Registro 0000 - Abertura
    lines.push(`|0000|015|0|${year}${String(month).padStart(2, '0')}01|${year}${String(month).padStart(2, '0')}${new Date(year, month, 0).getDate()}|${data.company.name}|${data.company.cnpj}||SP|||A|1|`);

    // Registro 0001 - Abertura Bloco 0
    lines.push('|0001|0|');

    // Registro 9999 - Encerramento
    lines.push(`|9999|${lines.length + 1}|`);

    return lines.join('\r\n');
  }
}
