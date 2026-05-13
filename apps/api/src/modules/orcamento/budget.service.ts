import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  ApproveBudgetDto,
  ReplicateBudgetDto,
} from './dto/budget.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateBudgetDto, createdBy: string) {
    // Find the next available version for this company/year
    const lastVersion = await this.prisma.budget.findFirst({
      where: { companyId, year: dto.year },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = (lastVersion?.version ?? 0) + 1;

    return this.prisma.budget.create({
      data: {
        companyId,
        name: dto.name,
        year: dto.year,
        version,
        status: 'DRAFT',
        createdBy,
      },
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    status?: string,
    year?: number,
  ) {
    const { page = 1, limit = 20, sortBy = 'year', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (status) where.status = status;
    if (year) where.year = year;

    const [data, total] = await Promise.all([
      this.prisma.budget.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.budget.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, companyId },
      include: {
        _count: { select: { lines: true, reallocations: true } },
      },
    });

    if (!budget) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return budget;
  }

  async update(companyId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.findOne(companyId, id);

    if (budget.status !== 'DRAFT') {
      throw new BadRequestException(
        'Somente orçamentos em rascunho podem ser alterados',
      );
    }

    return this.prisma.budget.update({
      where: { id: budget.id },
      data: { ...dto },
    });
  }

  async approve(
    companyId: string,
    id: string,
    dto: ApproveBudgetDto,
    approvedBy: string,
  ) {
    const budget = await this.findOne(companyId, id);

    if (budget.status !== 'DRAFT') {
      throw new BadRequestException('Orçamento não está em rascunho');
    }

    if (budget.createdBy === approvedBy) {
      throw new BadRequestException(
        'Maker/Checker: o mesmo usuário que criou não pode aprovar',
      );
    }

    // Check that budget has at least one line
    const lineCount = await this.prisma.budgetLine.count({
      where: { budgetId: id },
    });

    if (lineCount === 0) {
      throw new BadRequestException(
        'Orçamento deve ter pelo menos uma linha para ser aprovado',
      );
    }

    const status = dto.action === 'approve' ? 'APPROVED' : 'DRAFT';

    return this.prisma.budget.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  async activate(companyId: string, id: string) {
    const budget = await this.findOne(companyId, id);

    if (budget.status !== 'APPROVED') {
      throw new BadRequestException(
        'Somente orçamentos aprovados podem ser ativados',
      );
    }

    // Deactivate any other active budget for the same year
    await this.prisma.budget.updateMany({
      where: {
        companyId,
        year: budget.year,
        status: 'ACTIVE',
        id: { not: id },
      },
      data: { status: 'CLOSED' },
    });

    return this.prisma.budget.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async replicate(
    companyId: string,
    dto: ReplicateBudgetDto,
    createdBy: string,
  ) {
    // Find source budget
    const sourceWhere: Record<string, unknown> = {
      companyId,
      year: dto.sourceYear,
    };
    if (dto.sourceVersion) {
      sourceWhere.version = dto.sourceVersion;
    } else {
      // Get the latest active or approved version
      sourceWhere.status = { in: ['ACTIVE', 'APPROVED'] };
    }

    const sourceBudget = await this.prisma.budget.findFirst({
      where: sourceWhere,
      orderBy: { version: 'desc' },
      include: { lines: true },
    });

    if (!sourceBudget) {
      throw new NotFoundException('Orçamento de origem não encontrado');
    }

    // Find next version for target year
    const lastVersion = await this.prisma.budget.findFirst({
      where: { companyId, year: dto.targetYear },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = (lastVersion?.version ?? 0) + 1;

    // Create new budget with lines in a transaction
    return this.prisma.$transaction(async (tx) => {
      const newBudget = await tx.budget.create({
        data: {
          companyId,
          name: dto.name,
          year: dto.targetYear,
          version,
          status: 'DRAFT',
          createdBy,
        },
      });

      if (sourceBudget.lines.length > 0) {
        await tx.budgetLine.createMany({
          data: sourceBudget.lines.map((line) => ({
            budgetId: newBudget.id,
            accountId: line.accountId,
            costCenterId: line.costCenterId,
            projectId: line.projectId,
            branchId: line.branchId,
            jan: line.jan,
            feb: line.feb,
            mar: line.mar,
            apr: line.apr,
            may: line.may,
            jun: line.jun,
            jul: line.jul,
            aug: line.aug,
            sep: line.sep,
            oct: line.oct,
            nov: line.nov,
            dec: line.dec,
            total: line.total,
          })),
        });
      }

      return tx.budget.findUnique({
        where: { id: newBudget.id },
        include: { _count: { select: { lines: true } } },
      });
    });
  }
}
