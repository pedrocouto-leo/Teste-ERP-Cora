import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BalanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Balancete de verificacao (Trial Balance)
   * Returns all accounts with debit/credit totals and closing balance for a period
   */
  async getTrialBalance(companyId: string, periodId: string) {
    const period = await this.prisma.accountingPeriod.findFirst({
      where: { id: periodId, companyId },
    });

    if (!period) {
      throw new NotFoundException('Periodo contabil nao encontrado');
    }

    // Get all approved entries for this period
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        entry: {
          companyId,
          periodId,
          status: 'APPROVED',
        },
      },
      include: {
        account: true,
      },
    });

    // Aggregate by account
    const accountMap = new Map<
      string,
      {
        accountId: string;
        code: string;
        name: string;
        type: string;
        nature: string;
        cosifCode: string | null;
        level: number;
        totalDebits: Decimal;
        totalCredits: Decimal;
      }
    >();

    for (const line of lines) {
      if (!accountMap.has(line.accountId)) {
        accountMap.set(line.accountId, {
          accountId: line.accountId,
          code: line.account.code,
          name: line.account.name,
          type: line.account.type,
          nature: line.account.nature,
          cosifCode: line.account.cosifCode,
          level: line.account.level,
          totalDebits: new Decimal(0),
          totalCredits: new Decimal(0),
        });
      }

      const entry = accountMap.get(line.accountId)!;
      if (line.type === 'DEBIT') {
        entry.totalDebits = entry.totalDebits.add(line.amount);
      } else {
        entry.totalCredits = entry.totalCredits.add(line.amount);
      }
    }

    // Get opening balances from previous period
    let prevMonth = period.month - 1;
    let prevYear = period.year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const prevPeriod = await this.prisma.accountingPeriod.findUnique({
      where: {
        companyId_year_month: {
          companyId,
          year: prevYear,
          month: prevMonth,
        },
      },
    });

    const result = [];

    for (const [, accountData] of accountMap) {
      let openingBalance = new Decimal(0);

      if (prevPeriod) {
        const prevBalance = await this.prisma.accountBalance.findUnique({
          where: {
            companyId_accountId_periodId: {
              companyId,
              accountId: accountData.accountId,
              periodId: prevPeriod.id,
            },
          },
        });
        if (prevBalance) {
          openingBalance = prevBalance.closingBalance;
        }
      }

      let closingBalance: Decimal;
      if (accountData.nature === 'DEBIT') {
        closingBalance = openingBalance
          .add(accountData.totalDebits)
          .sub(accountData.totalCredits);
      } else {
        closingBalance = openingBalance
          .add(accountData.totalCredits)
          .sub(accountData.totalDebits);
      }

      result.push({
        ...accountData,
        openingBalance,
        closingBalance,
      });
    }

    // Sort by account code
    result.sort((a, b) => a.code.localeCompare(b.code));

    // Grand totals
    let grandTotalDebits = new Decimal(0);
    let grandTotalCredits = new Decimal(0);

    for (const r of result) {
      grandTotalDebits = grandTotalDebits.add(r.totalDebits);
      grandTotalCredits = grandTotalCredits.add(r.totalCredits);
    }

    return {
      period: {
        id: period.id,
        year: period.year,
        month: period.month,
        status: period.status,
      },
      accounts: result,
      totals: {
        totalDebits: grandTotalDebits,
        totalCredits: grandTotalCredits,
        balanced: grandTotalDebits.eq(grandTotalCredits),
      },
    };
  }

  /**
   * Balanco Patrimonial (Balance Sheet)
   * Aggregates ASSET, LIABILITY, EQUITY accounts
   */
  async getBalanceSheet(companyId: string, periodId: string) {
    const trialBalance = await this.getTrialBalance(companyId, periodId);

    const assets = trialBalance.accounts.filter((a) => a.type === 'ASSET');
    const liabilities = trialBalance.accounts.filter((a) => a.type === 'LIABILITY');
    const equity = trialBalance.accounts.filter((a) => a.type === 'EQUITY');

    const totalAssets = assets.reduce(
      (sum, a) => sum.add(a.closingBalance),
      new Decimal(0),
    );
    const totalLiabilities = liabilities.reduce(
      (sum, a) => sum.add(a.closingBalance),
      new Decimal(0),
    );
    const totalEquity = equity.reduce(
      (sum, a) => sum.add(a.closingBalance),
      new Decimal(0),
    );

    return {
      period: trialBalance.period,
      assets: {
        accounts: assets,
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilities,
        total: totalLiabilities,
      },
      equity: {
        accounts: equity,
        total: totalEquity,
      },
      balanced: totalAssets.eq(totalLiabilities.add(totalEquity)),
    };
  }

  /**
   * Demonstracao de Resultado (Income Statement / DRE)
   * Aggregates REVENUE and EXPENSE accounts
   */
  async getIncomeStatement(companyId: string, periodId: string) {
    const trialBalance = await this.getTrialBalance(companyId, periodId);

    const revenues = trialBalance.accounts.filter((a) => a.type === 'REVENUE');
    const expenses = trialBalance.accounts.filter((a) => a.type === 'EXPENSE');

    const totalRevenues = revenues.reduce(
      (sum, a) => sum.add(a.closingBalance),
      new Decimal(0),
    );
    const totalExpenses = expenses.reduce(
      (sum, a) => sum.add(a.closingBalance),
      new Decimal(0),
    );
    const netIncome = totalRevenues.sub(totalExpenses);

    return {
      period: trialBalance.period,
      revenues: {
        accounts: revenues,
        total: totalRevenues,
      },
      expenses: {
        accounts: expenses,
        total: totalExpenses,
      },
      netIncome,
    };
  }

  /**
   * Get stored balances from AccountBalance table (for closed periods)
   */
  async getStoredBalances(companyId: string, periodId: string) {
    const period = await this.prisma.accountingPeriod.findFirst({
      where: { id: periodId, companyId },
    });

    if (!period) {
      throw new NotFoundException('Periodo contabil nao encontrado');
    }

    const balances = await this.prisma.accountBalance.findMany({
      where: { companyId, periodId },
      include: { account: true },
      orderBy: { account: { code: 'asc' } },
    });

    return {
      period: {
        id: period.id,
        year: period.year,
        month: period.month,
        status: period.status,
      },
      balances,
    };
  }
}
