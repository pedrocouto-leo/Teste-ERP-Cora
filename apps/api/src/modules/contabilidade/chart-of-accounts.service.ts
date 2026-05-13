import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateChartOfAccountsDto,
  UpdateChartOfAccountsDto,
} from './dto/chart-of-accounts.dto';

@Injectable()
export class ChartOfAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateChartOfAccountsDto) {
    return this.prisma.chartOfAccounts.create({
      data: {
        companyId,
        name: dto.name,
        version: dto.version,
        validFrom: new Date(dto.validFrom),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.chartOfAccounts.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const chart = await this.prisma.chartOfAccounts.findFirst({
      where: { id, companyId },
    });

    if (!chart) {
      throw new NotFoundException('Plano de contas nao encontrado');
    }

    return chart;
  }

  async getTree(companyId: string, id: string) {
    return this.findOneWithAccounts(companyId, id);
  }

  async findOneWithAccounts(companyId: string, id: string) {
    const chart = await this.prisma.chartOfAccounts.findFirst({
      where: { id, companyId },
      include: {
        accounts: {
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!chart) {
      throw new NotFoundException('Plano de contas nao encontrado');
    }

    const { accounts, ...chartData } = chart;
    return {
      ...chartData,
      accounts: this.buildAccountTree(accounts),
    };
  }

  async update(companyId: string, id: string, dto: UpdateChartOfAccountsDto) {
    const chart = await this.findOne(companyId, id);

    return this.prisma.chartOfAccounts.update({
      where: { id: chart.id },
      data: {
        ...dto,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
      },
    });
  }

  async delete(companyId: string, id: string) {
    return this.remove(companyId, id);
  }

  async remove(companyId: string, id: string) {
    const chart = await this.findOne(companyId, id);

    const accountCount = await this.prisma.account.count({
      where: { chartId: id },
    });

    if (accountCount > 0) {
      throw new ConflictException(
        'Nao e possivel excluir plano de contas com contas vinculadas',
      );
    }

    return this.prisma.chartOfAccounts.delete({
      where: { id: chart.id },
    });
  }

  private buildAccountTree(
    accounts: Array<{ id: string; parentId: string | null; [key: string]: unknown }>,
  ) {
    const map = new Map<string, { children: unknown[]; [key: string]: unknown }>();
    const roots: unknown[] = [];

    for (const account of accounts) {
      map.set(account.id, { ...account, children: [] });
    }

    for (const account of accounts) {
      const node = map.get(account.id)!;
      if (account.parentId && map.has(account.parentId)) {
        map.get(account.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
