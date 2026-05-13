import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashAccountDto, UpdateCashAccountDto } from './dto/cash-account.dto';

@Injectable()
export class CashAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateCashAccountDto, createdBy: string) {
    const existing = await this.prisma.cashAccount.findUnique({
      where: { companyId_name: { companyId, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException('Ja existe uma conta caixa/banco com este nome');
    }

    return this.prisma.cashAccount.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type,
        bankAccountId: dto.bankAccountId || null,
        branchId: dto.branchId || null,
        createdBy,
      },
    });
  }

  async findAll(companyId: string, filters?: { type?: string; active?: boolean }) {
    const where: Record<string, unknown> = { companyId };
    if (filters?.type) where.type = filters.type;
    if (filters?.active !== undefined) where.active = filters.active;

    return this.prisma.cashAccount.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const account = await this.prisma.cashAccount.findFirst({
      where: { id, companyId },
    });

    if (!account) {
      throw new NotFoundException('Conta caixa/banco nao encontrada');
    }

    return account;
  }

  async getBalance(companyId: string, id: string) {
    const account = await this.findOne(companyId, id);
    return {
      id: account.id,
      name: account.name,
      balance: account.balance,
    };
  }

  async getMovements(
    companyId: string,
    id: string,
    filters?: { dateFrom?: string; dateTo?: string; limit?: number },
  ) {
    await this.findOne(companyId, id);

    const where: Record<string, unknown> = { companyId, cashAccountId: id };
    if (filters?.dateFrom || filters?.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.date = dateFilter;
    }

    return this.prisma.cashMovement.findMany({
      where,
      orderBy: { date: 'desc' },
      take: filters?.limit || 100,
    });
  }

  async update(companyId: string, id: string, dto: UpdateCashAccountDto, updatedBy: string) {
    const account = await this.findOne(companyId, id);

    if (dto.name && dto.name !== account.name) {
      const existing = await this.prisma.cashAccount.findUnique({
        where: { companyId_name: { companyId, name: dto.name } },
      });
      if (existing) {
        throw new ConflictException('Ja existe uma conta caixa/banco com este nome');
      }
    }

    return this.prisma.cashAccount.update({
      where: { id: account.id },
      data: {
        ...dto,
        updatedBy,
      },
    });
  }

  async deactivate(companyId: string, id: string, updatedBy: string) {
    const account = await this.findOne(companyId, id);

    return this.prisma.cashAccount.update({
      where: { id: account.id },
      data: { active: false, updatedBy },
    });
  }
}
