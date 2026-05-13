import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BacenReportService {
  private readonly logger = new Logger(BacenReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Doc 6209 - Estatísticas de Varejo e Canais de Atendimento
   */
  async generateDoc6209(companyId: string, year: number, month: number) {
    return {
      documento: 'DOC-6209',
      periodo: `${year}-${String(month).padStart(2, '0')}`,
      canais: {
        internet: { transacoes: 0, valor: 0 },
        mobile: { transacoes: 0, valor: 0 },
        presencial: { transacoes: 0, valor: 0 },
      },
      status: 'GENERATED',
      note: 'Dados reais devem ser integrados com sistema de canais',
      generatedAt: new Date(),
    };
  }

  /**
   * Informe de Rendimentos (IN RFB 698/2006 e IN RFB 1235/2012)
   */
  async generateInformeRendimentos(companyId: string, year: number) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
    });

    // Buscar pagamentos com retenção de IR no ano
    const payables = await this.prisma.payableTitle.findMany({
      where: {
        companyId,
        status: 'PAID',
        updatedAt: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
    });

    const informes = [];
    for (const payable of payables) {
      const taxes = await this.prisma.payableTax.findMany({
        where: { titleId: payable.id, taxType: 'IR' },
      });

      if (taxes.length > 0) {
        informes.push({
          supplierId: payable.supplierId,
          totalPago: Number(payable.originalAmount),
          irRetido: taxes.reduce((s, t) => s + Number(t.amount), 0),
        });
      }
    }

    // Agrupar por fornecedor
    const bySupplier = new Map<string, { totalPago: number; irRetido: number }>();
    for (const inf of informes) {
      const existing = bySupplier.get(inf.supplierId) || { totalPago: 0, irRetido: 0 };
      existing.totalPago += inf.totalPago;
      existing.irRetido += inf.irRetido;
      bySupplier.set(inf.supplierId, existing);
    }

    return {
      documento: 'INFORME_RENDIMENTOS',
      anoCalendario: year,
      fontePagedora: { cnpj: company?.cnpj, nome: company?.name },
      totalBeneficiarios: bySupplier.size,
      beneficiarios: Array.from(bySupplier.entries()).map(([supplierId, dados]) => ({
        supplierId,
        rendimentosTributaveis: dados.totalPago,
        impostoRetido: dados.irRetido,
      })),
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }

  /**
   * Resolução 3919 Art. 19 - Tarifas e Encargos
   */
  async generateTarifasEncargos(companyId: string) {
    return {
      documento: 'RES_3919_ART19',
      descricao: 'Tabela de Tarifas e Encargos - Resolução 3919',
      tarifas: [
        { servico: 'Manutenção de conta', periodicidade: 'Mensal', valor: 0, tipo: 'ESSENCIAL' },
        { servico: 'Transferência TED', periodicidade: 'Evento', valor: 0, tipo: 'PRIORITARIO' },
        { servico: 'Extrato mensal', periodicidade: 'Mensal', valor: 0, tipo: 'ESSENCIAL' },
      ],
      note: 'Valores devem ser configurados conforme política comercial',
      status: 'TEMPLATE',
      generatedAt: new Date(),
    };
  }
}
