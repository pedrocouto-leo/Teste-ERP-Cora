import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalEntryDto, ApproveEntryDto } from './dto/journal-entry.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class JournalEntryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    dto: CreateJournalEntryDto,
    createdBy: string,
  ) {
    const entryDate = new Date(dto.date);

    // 1. Find the period for this date
    const period = await this.prisma.accountingPeriod.findFirst({
      where: {
        companyId,
        startDate: { lte: entryDate },
        endDate: { gte: entryDate },
      },
    });

    if (!period) {
      throw new BadRequestException(
        'Nao existe periodo contabil aberto para esta data',
      );
    }

    // 2. Validate period is OPEN
    if (period.status !== 'OPEN') {
      throw new BadRequestException(
        `Periodo ${period.month}/${period.year} nao esta aberto (status: ${period.status})`,
      );
    }

    // 3. Validate all accounts exist and allow posting
    for (const line of dto.lines) {
      const account = await this.prisma.account.findUnique({
        where: { id: line.accountId },
      });

      if (!account) {
        throw new BadRequestException(
          `Conta ${line.accountId} nao encontrada`,
        );
      }

      if (!account.allowsPosting) {
        throw new BadRequestException(
          `Conta ${account.code} - ${account.name} nao permite lancamento direto (conta sintetica)`,
        );
      }

      if (!account.active) {
        throw new BadRequestException(
          `Conta ${account.code} - ${account.name} esta inativa`,
        );
      }
    }

    // 4. CRITICAL: Validate debits = credits (fundamental accounting equation)
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of dto.lines) {
      const amount = new Decimal(line.amount);
      if (amount.lte(0)) {
        throw new BadRequestException('Valor do lancamento deve ser positivo');
      }
      if (line.type === 'DEBIT') {
        totalDebit = totalDebit.add(amount);
      } else {
        totalCredit = totalCredit.add(amount);
      }
    }

    if (!totalDebit.eq(totalCredit)) {
      throw new BadRequestException(
        `Lancamento desbalanceado: debitos (${totalDebit}) diferem dos creditos (${totalCredit}). ` +
          'Total de debitos deve ser igual ao total de creditos.',
      );
    }

    // Validate at least one debit and one credit
    const hasDebit = dto.lines.some((l) => l.type === 'DEBIT');
    const hasCredit = dto.lines.some((l) => l.type === 'CREDIT');
    if (!hasDebit || !hasCredit) {
      throw new BadRequestException(
        'Lancamento deve ter pelo menos uma partida a debito e uma a credito',
      );
    }

    // 5. Auto-generate entry number per company
    const lastEntry = await this.prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { entryNumber: 'desc' },
    });
    const entryNumber = (lastEntry?.entryNumber ?? 0) + 1;

    // 6. Create entry with lines in a transaction
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          periodId: period.id,
          entryNumber,
          date: entryDate,
          description: dto.description,
          type: dto.type || 'MANUAL',
          status: 'DRAFT',
          totalDebit,
          totalCredit,
          createdBy,
          lines: {
            create: dto.lines.map((line) => ({
              accountId: line.accountId,
              type: line.type,
              amount: new Decimal(line.amount),
              costCenterId: line.costCenterId || null,
              projectId: line.projectId || null,
              description: line.description || null,
            })),
          },
        },
        include: { lines: true },
      });

      return entry;
    });
  }

  async findAll(
    companyId: string,
    pagination: { page?: number; limit?: number } = {},
    filters: {
      periodId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ) {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (filters.periodId) where.periodId = filters.periodId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
      if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
      where.date = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        skip,
        take: limit,
        include: { lines: { include: { account: true } } },
        orderBy: { entryNumber: 'desc' },
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, companyId },
      include: {
        lines: { include: { account: true } },
        period: true,
      },
    });

    if (!entry) {
      throw new NotFoundException('Lancamento contabil nao encontrado');
    }

    return entry;
  }

  async submit(companyId: string, id: string, _userId: string) {
    return this.submitForApproval(companyId, id);
  }

  async submitForApproval(companyId: string, id: string) {
    const entry = await this.findOne(companyId, id);

    if (entry.status !== 'DRAFT') {
      throw new BadRequestException(
        `Somente lancamentos em rascunho podem ser enviados para aprovacao (status atual: ${entry.status})`,
      );
    }

    return this.prisma.journalEntry.update({
      where: { id },
      data: { status: 'PENDING' },
      include: { lines: true },
    });
  }

  async approve(
    companyId: string,
    id: string,
    dto: ApproveEntryDto,
    userId: string,
  ) {
    const entry = await this.findOne(companyId, id);

    if (entry.status !== 'PENDING') {
      throw new BadRequestException(
        `Somente lancamentos pendentes podem ser aprovados/rejeitados (status atual: ${entry.status})`,
      );
    }

    // Maker/checker: approver must be different from creator
    if (entry.createdBy === userId) {
      throw new BadRequestException(
        'O aprovador nao pode ser o mesmo usuario que criou o lancamento (maker/checker)',
      );
    }

    const newStatus = dto.action === 'APPROVED' ? 'APPROVED' : 'REJECTED';

    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: { lines: true },
    });
  }

  async delete(companyId: string, id: string) {
    return this.remove(companyId, id);
  }

  async remove(companyId: string, id: string) {
    const entry = await this.findOne(companyId, id);

    if (entry.status !== 'DRAFT') {
      throw new BadRequestException(
        'Somente lancamentos em rascunho podem ser excluidos',
      );
    }

    return this.prisma.journalEntry.delete({
      where: { id },
    });
  }
}
