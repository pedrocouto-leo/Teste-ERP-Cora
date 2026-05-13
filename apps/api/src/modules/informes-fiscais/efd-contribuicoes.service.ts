import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpedBuilder, SpedServiceDoc } from './sped-builder';

@Injectable()
export class EfdContribuicoesService {
  private readonly logger = new Logger(EfdContribuicoesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera escrituração EFD-Contribuições (PIS/COFINS).
   * Retorna o resumo dos blocos e os totais para o usuário visualizar.
   */
  async generate(companyId: string, year: number, month: number) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Empresa não encontrada');

    const { startDate, endDate } = this.periodRange(year, month);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: startDate, lte: endDate },
        status: 'ISSUED',
      },
      include: { taxes: true },
    });

    let pisTotal = 0;
    let cofinsTotal = 0;
    const docs: SpedServiceDoc[] = [];

    for (const inv of invoices) {
      const pis = inv.taxes.find((t) => t.taxType === 'PIS');
      const cofins = inv.taxes.find((t) => t.taxType === 'COFINS');
      const pisAmount = Number(pis?.amount ?? 0);
      const cofinsAmount = Number(cofins?.amount ?? 0);
      pisTotal += pisAmount;
      cofinsTotal += cofinsAmount;
      docs.push({
        documentId: inv.invoiceNumber,
        issueDate: inv.issueDate,
        totalValue: Number(inv.totalAmount),
        pisAmount,
        cofinsAmount,
        baseAmount: Number(inv.subtotal),
      });
    }

    return {
      period: this.yyyymm(year, month),
      company: { cnpj: company.cnpj, name: company.name },
      blocks: {
        block0: { records: 5, description: 'Abertura e identificação' },
        blockA: { records: docs.length * 2 + 2, description: 'Documentos fiscais de serviços' },
        blockM: {
          pisApurado: pisTotal,
          cofinsApurado: cofinsTotal,
          description: 'Apuração PIS/COFINS',
        },
      },
      docs,
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }

  /**
   * Exporta o arquivo SPED em texto fixo pipe-delimited.
   */
  async exportFile(companyId: string, year: number, month: number): Promise<string> {
    const company = await this.prisma.company.findFirst({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Empresa não encontrada');

    const data = await this.generate(companyId, year, month);
    const { startDate, endDate } = this.periodRange(year, month);

    return new SpedBuilder({
      cnpj: company.cnpj,
      companyName: company.name,
      startDate,
      endDate,
      state: 'SP',
    })
      .block0()
      .blockA(data.docs)
      .blockM({
        pisTotal: data.blocks.blockM.pisApurado,
        cofinsTotal: data.blocks.blockM.cofinsApurado,
      })
      .block1()
      .block9()
      .build();
  }

  private periodRange(year: number, month: number) {
    return {
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  private yyyymm(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}
