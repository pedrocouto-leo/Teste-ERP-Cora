import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

export interface AccountNode {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  children: AccountNode[];
  [key: string]: unknown;
}

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertChartOwnedByCompany(companyId: string, chartId: string) {
    const chart = await this.prisma.chartOfAccounts.findFirst({
      where: { id: chartId, companyId },
    });
    if (!chart) {
      throw new NotFoundException('Plano de contas não encontrado');
    }
    return chart;
  }

  async create(companyId: string, dto: CreateAccountDto) {
    await this.assertChartOwnedByCompany(companyId, dto.chartId);

    const existing = await this.prisma.account.findFirst({
      where: { chartId: dto.chartId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Conta com este código já existe neste plano');
    }

    if (dto.parentId) {
      const parent = await this.prisma.account.findFirst({
        where: { id: dto.parentId, chartId: dto.chartId },
      });
      if (!parent) {
        throw new NotFoundException('Conta pai não encontrada neste plano');
      }
      if (dto.level !== parent.level + 1) {
        throw new BadRequestException(
          `Nível deve ser ${parent.level + 1} (pai está no nível ${parent.level})`,
        );
      }
    } else if (dto.level !== 1) {
      throw new BadRequestException('Conta raiz deve ter nível 1');
    }

    return this.prisma.account.create({ data: dto });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    filters: {
      chartId?: string;
      type?: string;
      level?: number;
      cosifCode?: string;
      search?: string;
    } = {},
  ) {
    const { page = 1, limit = 50, sortBy = 'code', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.AccountWhereInput = {
      chart: { companyId },
    };
    if (filters.chartId) where.chartId = filters.chartId;
    if (filters.type) where.type = filters.type;
    if (filters.level !== undefined) where.level = filters.level;
    if (filters.cosifCode) where.cosifCode = { contains: filters.cosifCode };
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.account.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findTree(companyId: string, chartId: string) {
    await this.assertChartOwnedByCompany(companyId, chartId);

    const accounts = await this.prisma.account.findMany({
      where: { chartId },
      orderBy: { code: 'asc' },
    });

    return this.buildTree(accounts);
  }

  async findOne(companyId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, chart: { companyId } },
      include: {
        parent: true,
        children: { orderBy: { code: 'asc' } },
      },
    });

    if (!account) {
      throw new NotFoundException('Conta contábil não encontrada');
    }

    return account;
  }

  async update(companyId: string, id: string, dto: UpdateAccountDto) {
    const account = await this.findOne(companyId, id);

    if (dto.allowsPosting === true) {
      const childCount = await this.prisma.account.count({
        where: { parentId: id },
      });
      if (childCount > 0) {
        throw new BadRequestException(
          'Conta com filhos não pode permitir lançamento direto',
        );
      }
    }

    return this.prisma.account.update({
      where: { id: account.id },
      data: dto,
    });
  }

  async delete(companyId: string, id: string) {
    const account = await this.findOne(companyId, id);

    const children = await this.prisma.account.count({
      where: { parentId: id },
    });
    if (children > 0) {
      throw new ConflictException(
        'Não é possível excluir conta com subcontas vinculadas',
      );
    }

    const lineCount = await this.prisma.journalEntryLine.count({
      where: { accountId: id },
    });
    if (lineCount > 0) {
      throw new ConflictException(
        'Não é possível excluir conta com lançamentos vinculados',
      );
    }

    return this.prisma.account.delete({ where: { id: account.id } });
  }

  private buildTree(
    items: Array<{ id: string; parentId: string | null; [key: string]: unknown }>,
  ): AccountNode[] {
    const map = new Map<string, AccountNode>();
    const roots: AccountNode[] = [];

    for (const item of items) {
      map.set(item.id, {
        ...item,
        code: item.code as string,
        name: item.name as string,
        children: [],
      } as AccountNode);
    }

    for (const item of items) {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
