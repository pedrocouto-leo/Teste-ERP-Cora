import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScrService {
  private readonly logger = new Logger(ScrService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * SCR - Sistema de Informações de Crédito do Banco Central
   * Doc 3040 - Dados sobre operações de crédito
   */
  async generateDoc3040(companyId: string, referenceDate: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
    });

    // Buscar todos os títulos a receber ativos (representam operações de crédito)
    const receivables = await this.prisma.receivableTitle.findMany({
      where: {
        companyId,
        status: { in: ['OPEN', 'PARTIAL', 'OVERDUE'] },
      },
    });

    const operacoes = receivables.map((r) => ({
      codigoCliente: r.clientId,
      modalidade: '0201',
      dataOrigem: r.issueDate,
      dataVencimento: r.dueDate,
      valorOriginal: Number(r.originalAmount),
      saldoDevedor: Number(r.balance),
      situacao: r.status === 'OVERDUE' ? 'VENCIDA' : 'NORMAL',
      diasAtraso: r.status === 'OVERDUE'
        ? Math.floor((Date.now() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));

    const totalCarteira = operacoes.reduce((sum, op) => sum + op.saldoDevedor, 0);
    const operacoesVencidas = operacoes.filter((op) => op.situacao === 'VENCIDA');

    return {
      documento: 'SCR-3040',
      dataReferencia: referenceDate,
      cnpjInstituicao: company?.cnpj,
      resumo: {
        totalOperacoes: operacoes.length,
        totalCarteira,
        operacoesNormais: operacoes.length - operacoesVencidas.length,
        operacoesVencidas: operacoesVencidas.length,
        valorVencido: operacoesVencidas.reduce((s, o) => s + o.saldoDevedor, 0),
      },
      operacoes,
      formato: 'XML',
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }

  /**
   * Doc 3050 - Dados sobre clientes com responsabilidade total >= R$ 200
   */
  async generateDoc3050(companyId: string, referenceDate: string) {
    const receivables = await this.prisma.receivableTitle.findMany({
      where: {
        companyId,
        status: { in: ['OPEN', 'PARTIAL', 'OVERDUE'] },
      },
    });

    // Agrupar por cliente
    const byClient = new Map<string, number>();
    for (const r of receivables) {
      const current = byClient.get(r.clientId) || 0;
      byClient.set(r.clientId, current + Number(r.balance));
    }

    // Filtrar clientes com saldo >= 200
    const clientesReportaveis = Array.from(byClient.entries())
      .filter(([, saldo]) => saldo >= 200)
      .map(([clientId, saldo]) => ({
        codigoCliente: clientId,
        responsabilidadeTotal: saldo,
      }));

    return {
      documento: 'SCR-3050',
      dataReferencia: referenceDate,
      totalClientes: clientesReportaveis.length,
      clientes: clientesReportaveis,
      formato: 'XML',
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }
}
