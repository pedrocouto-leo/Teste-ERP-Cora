import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountingPeriodDto } from './dto/accounting-period.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AccountingPeriodService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateAccountingPeriodDto) {
    const existing = await this.prisma.accountingPeriod.findUnique({
      where: {
        companyId_year_month: {
          companyId,
          year: dto.year,
          month: dto.month,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Periodo ${dto.month}/${dto.year} ja existe`,
      );
    }

    const startDate = new Date(dto.year, dto.month - 1, 1);
    const endDate = new Date(dto.year, dto.month, 0); // Last day of month

    return this.prisma.accountingPeriod.create({
      data: {
        companyId,
        year: dto.year,
        month: dto.month,
        startDate,
        endDate,
        status: 'OPEN',
      },
    });
  }

  async findAll(
    companyId: string,
    filters: { year?: number; status?: string } = {},
  ) {
    const where: Record<string, unknown> = { companyId };
    if (filters.year) where.year = filters.year;
    if (filters.status) where.status = filters.status;

    return this.prisma.accountingPeriod.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async findOne(companyId: string, id: string) {
    const period = await this.prisma.accountingPeriod.findFirst({
      where: { id, companyId },
    });

    if (!period) {
      throw new NotFoundException('Periodo contabil nao encontrado');
    }

    return period;
  }

  async close(companyId: string, id: string, userId: string) {
    const period = await this.findOne(companyId, id);

    if (period.status === 'CLOSED') {
      throw new BadRequestException('Periodo ja esta fechado');
    }

    // Verify all entries are approved or rejected (no DRAFT or PENDING)
    const pendingEntries = await this.prisma.journalEntry.count({
      where: {
        companyId,
        periodId: id,
        status: { in: ['DRAFT', 'PENDING'] },
      },
    });

    if (pendingEntries > 0) {
      throw new BadRequestException(
        `Existem ${pendingEntries} lancamento(s) pendentes de aprovacao neste periodo`,
      );
    }

    // Set status to CLOSING
    await this.prisma.accountingPeriod.update({
      where: { id },
      data: { status: 'CLOSING' },
    });

    // Compute balances for all accounts with approved entries in this period
    await this.computeBalances(companyId, id);

    // Set status to CLOSED
    return this.prisma.accountingPeriod.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: userId,
      },
    });
  }

  async reopen(companyId: string, id: string) {
    const period = await this.findOne(companyId, id);

    if (period.status !== 'CLOSED') {
      throw new BadRequestException('Somente periodos fechados podem ser reabertos');
    }

    return this.prisma.accountingPeriod.update({
      where: { id },
      data: {
        status: 'OPEN',
        closedAt: null,
        closedBy: null,
      },
    });
  }

  private async computeBalances(companyId: string, periodId: string) {
    // Get all approved entries for this period
    const entries = await this.prisma.journalEntry.findMany({
      where: {
        companyId,
        periodId,
        status: 'APPROVED',
      },
      include: { lines: true },
    });

    // Aggregate debits and credits per account
    const accountTotals = new Map<
      string,
      { debits: Decimal; credits: Decimal }
    >();

    for (const entry of entries) {
      for (const line of entry.lines) {
        if (!accountTotals.has(line.accountId)) {
          accountTotals.set(line.accountId, {
            debits: new Decimal(0),
            credits: new Decimal(0),
          });
        }
        const totals = accountTotals.get(line.accountId)!;
        if (line.type === 'DEBIT') {
          totals.debits = totals.debits.add(line.amount);
        } else {
          totals.credits = totals.credits.add(line.amount);
        }
      }
    }

    // Get previous period for opening balances
    const period = await this.prisma.accountingPeriod.findUnique({
      where: { id: periodId },
    });

    let prevMonth = period!.month - 1;
    let prevYear = period!.year;
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

    // Upsert balances
    for (const [accountId, totals] of accountTotals) {
      let openingBalance = new Decimal(0);

      if (prevPeriod) {
        const prevBalance = await this.prisma.accountBalance.findUnique({
          where: {
            companyId_accountId_periodId: {
              companyId,
              accountId,
              periodId: prevPeriod.id,
            },
          },
        });
        if (prevBalance) {
          openingBalance = prevBalance.closingBalance;
        }
      }

      // Get account nature to determine closing balance direction
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
      });

      let closingBalance: Decimal;
      if (account?.nature === 'DEBIT') {
        closingBalance = openingBalance.add(totals.debits).sub(totals.credits);
      } else {
        closingBalance = openingBalance.add(totals.credits).sub(totals.debits);
      }

      await this.prisma.accountBalance.upsert({
        where: {
          companyId_accountId_periodId: {
            companyId,
            accountId,
            periodId,
          },
        },
        create: {
          companyId,
          accountId,
          periodId,
          openingBalance,
          totalDebits: totals.debits,
          totalCredits: totals.credits,
          closingBalance,
        },
        update: {
          openingBalance,
          totalDebits: totals.debits,
          totalCredits: totals.credits,
          closingBalance,
        },
      });
    }
  }
}
