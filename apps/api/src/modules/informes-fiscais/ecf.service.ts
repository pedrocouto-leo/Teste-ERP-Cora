import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EcfService {
  private readonly logger = new Logger(EcfService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ECF - Escrituração Contábil Fiscal (IRPJ/CSLL)
   * Lucro Real ou Presumido
   */
  async generate(companyId: string, year: number) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId },
    });

    // Busca saldos contábeis do ano
    const periods = await this.prisma.accountingPeriod.findMany({
      where: { companyId, year, status: 'CLOSED' },
      orderBy: { month: 'asc' },
    });

    // Busca balanço patrimonial
    const balances = await this.prisma.accountBalance.findMany({
      where: {
        companyId,
        periodId: { in: periods.map((p) => p.id) },
      },
      include: { account: true },
    });

    // Calcula lucro líquido (receitas - despesas)
    const revenueAccounts = balances.filter(
      (b) => b.account.type === 'REVENUE',
    );
    const expenseAccounts = balances.filter(
      (b) => b.account.type === 'EXPENSE',
    );

    const totalRevenue = revenueAccounts.reduce(
      (sum, b) => sum + Number(b.closingBalance),
      0,
    );
    const totalExpenses = expenseAccounts.reduce(
      (sum, b) => sum + Number(b.closingBalance),
      0,
    );
    const lucroLiquido = totalRevenue - totalExpenses;

    // Calculo IRPJ (Lucro Real simplificado)
    const irpjBase = lucroLiquido;
    const irpjNormal = irpjBase * 0.15;
    const irpjAdicional = irpjBase > 240000 ? (irpjBase - 240000) * 0.1 : 0;
    const irpjTotal = irpjNormal + irpjAdicional;

    // Calculo CSLL
    const csllBase = lucroLiquido;
    const csllTotal = csllBase * 0.09;

    return {
      year,
      company: { cnpj: company?.cnpj, name: company?.name },
      regime: 'LUCRO_REAL',
      closedPeriods: periods.length,
      demonstracao: {
        totalRevenue,
        totalExpenses,
        lucroLiquido,
      },
      irpj: {
        baseCalculo: irpjBase,
        aliquotaNormal: 15,
        valorNormal: irpjNormal,
        aliquotaAdicional: 10,
        valorAdicional: irpjAdicional,
        total: irpjTotal,
      },
      csll: {
        baseCalculo: csllBase,
        aliquota: 9,
        total: csllTotal,
      },
      totalTributos: irpjTotal + csllTotal,
      status: 'GENERATED',
      generatedAt: new Date(),
    };
  }
}
