import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

interface AccountNode {
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

  async create(dto: CreateAccountDto) {
    // Validate chart exists
    const chart = await this.prisma.chartOfAccounts.findUnique({
      where: { id: dto.chartId },
    });
    if (!chart) {
      throw new NotFoundException('Plano de contas nao encontrado');
    }

    // Validate code uniqueness within chart
    const existing = await this.prisma.account.findFirst({
      where: { chartId: dto.chartId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Conta com este codigo ja existe neste plano');
    }

    // Validate parent relationship
    if (dto.parentId) {
      const parent = await this.prisma.account.findFirst({
        where: { id: dto.parentId, chartId: dto.chartId },
      });
      if (!parent) {
        throw new NotFoundException('Conta pai nao encontrada neste plano');
      }
      // Level must be parent level + 1
      if (dto.level !== parent.level + 1) {
        throw new BadRequestException(
          `Nivel deve ser ${parent.level + 1} (pai esta no nivel ${parent.level})`,
        );
      }
    } else {
      // Root account must be level 1
      if (dto.level !== 1) {
        throw new BadRequestException(
          'Conta raiz deve ter nivel 1',
        );
      }
    }

    // Only leaf accounts can have allowsPosting = true
    if (dto.allowsPosting) {
      const hasChildren = await this.prisma.account.findFirst({
        where: { parentId: dto.parentId, chartId: dto.chartId },
      });
      // This is a new account, so it's a leaf by definition - just validate intent
    }

    return this.prisma.account.create({
      data: dto,
    });
  }

  async findAll(
    chartId?: string,
    filters?: {
      type?: string;
      level?: number;
      cosifCode?: string;
      active?: boolean;
    },
  ) {
    const where: Record<string, unknown> = {};
    if (chartId) where.chartId = chartId;
    if (filters?.type) where.type = filters.type;
    if (filters?.level) where.level = filters.level;
    if (filters?.cosifCode) where.cosifCode = { contains: filters.cosifCode };
    if (filters?.active !== undefined) where.active = filters.active;

    return this.prisma.account.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  async findTree(chartId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { chartId },
      orderBy: { code: 'asc' },
    });

    return this.buildTree(accounts);
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { orderBy: { code: 'asc' } },
      },
    });

    if (!account) {
      throw new NotFoundException('Conta contabil nao encontrada');
    }

    return account;
  }

  async update(id: string, dto: UpdateAccountDto) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Conta contabil nao encontrada');
    }

    // If enabling allowsPosting, ensure no children exist
    if (dto.allowsPosting === true) {
      const childCount = await this.prisma.account.count({
        where: { parentId: id },
      });
      if (childCount > 0) {
        throw new BadRequestException(
          'Conta com filhos nao pode permitir lancamento direto',
        );
      }
    }

    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Conta contabil nao encontrada');
    }

    const children = await this.prisma.account.count({
      where: { parentId: id },
    });

    if (children > 0) {
      throw new ConflictException(
        'Nao e possivel excluir conta com subcontas vinculadas',
      );
    }

    // Check if account has any journal entry lines
    const lineCount = await this.prisma.journalEntryLine.count({
      where: { accountId: id },
    });

    if (lineCount > 0) {
      throw new ConflictException(
        'Nao e possivel excluir conta com lancamentos vinculados',
      );
    }

    return this.prisma.account.delete({
      where: { id },
    });
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
