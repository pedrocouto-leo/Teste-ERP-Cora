import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStandardEntryDto,
  UpdateStandardEntryDto,
} from './dto/standard-entry.dto';
import { Decimal } from '@prisma/client/runtime/library';

interface TemplateLine {
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount?: number;
  costCenterId?: string;
  projectId?: string;
  description?: string;
}

@Injectable()
export class StandardEntryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateStandardEntryDto) {
    const existing = await this.prisma.standardEntry.findFirst({
      where: { companyId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        'Lancamento padrao com este codigo ja existe',
      );
    }

    return this.prisma.standardEntry.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        description: dto.description || null,
        lines: dto.lines as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.standardEntry.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const entry = await this.prisma.standardEntry.findFirst({
      where: { id, companyId },
    });

    if (!entry) {
      throw new NotFoundException('Lancamento padrao nao encontrado');
    }

    return entry;
  }

  async update(companyId: string, id: string, dto: UpdateStandardEntryDto) {
    const entry = await this.findOne(companyId, id);

    return this.prisma.standardEntry.update({
      where: { id: entry.id },
      data: {
        ...dto,
        lines: dto.lines
          ? (dto.lines as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  async delete(companyId: string, id: string) {
    return this.remove(companyId, id);
  }

  async remove(companyId: string, id: string) {
    const entry = await this.findOne(companyId, id);

    return this.prisma.standardEntry.delete({
      where: { id: entry.id },
    });
  }

  async execute(
    companyId: string,
    id: string,
    data: { date: string; description?: string; amounts?: Record<string, number> },
    createdBy: string,
  ) {
    const template = await this.findOne(companyId, id);
    const lines = template.lines as unknown as TemplateLine[];

    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      throw new BadRequestException(
        'Template invalido: deve conter pelo menos 2 linhas',
      );
    }

    const entryDate = new Date(data.date);

    // Find the period for this date
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

    if (period.status !== 'OPEN') {
      throw new BadRequestException(
        `Periodo ${period.month}/${period.year} nao esta aberto`,
      );
    }

    // Resolve amounts - use provided amounts or template amounts
    const resolvedLines = lines.map((line, index) => {
      const amount =
        data.amounts && data.amounts[index.toString()]
          ? data.amounts[index.toString()]
          : line.amount;

      if (!amount || amount <= 0) {
        throw new BadRequestException(
          `Valor nao informado para linha ${index + 1}`,
        );
      }

      return {
        accountId: line.accountId,
        type: line.type,
        amount: new Decimal(amount),
        costCenterId: line.costCenterId || null,
        projectId: line.projectId || null,
        description: line.description || null,
      };
    });

    // Validate balance
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of resolvedLines) {
      if (line.type === 'DEBIT') {
        totalDebit = totalDebit.add(line.amount);
      } else {
        totalCredit = totalCredit.add(line.amount);
      }
    }

    if (!totalDebit.eq(totalCredit)) {
      throw new BadRequestException(
        `Lancamento desbalanceado: debitos (${totalDebit}) diferem dos creditos (${totalCredit})`,
      );
    }

    // Auto-generate entry number
    const lastEntry = await this.prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { entryNumber: 'desc' },
    });
    const entryNumber = (lastEntry?.entryNumber ?? 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          companyId,
          periodId: period.id,
          entryNumber,
          date: entryDate,
          description:
            data.description || `${template.name} (via template ${template.code})`,
          type: 'TEMPLATE',
          status: 'DRAFT',
          totalDebit,
          totalCredit,
          createdBy,
          lines: {
            create: resolvedLines,
          },
        },
        include: { lines: true },
      });

      return entry;
    });
  }
}
