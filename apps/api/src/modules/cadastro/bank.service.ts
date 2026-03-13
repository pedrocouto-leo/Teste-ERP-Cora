import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBankDto,
  CreateBankAgencyDto,
  CreateOwnBankAccountDto,
} from './dto/bank.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class BankService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Banks ───────────────────────────────────────────────

  async createBank(
    companyId: string,
    dto: CreateBankDto,
    createdBy: string,
  ) {
    const existing = await this.prisma.bank.findFirst({
      where: { companyId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Banco com este código já cadastrado');
    }

    return this.prisma.bank.create({
      data: { companyId, ...dto, createdBy },
    });
  }

  async findAllBanks(companyId: string, pagination: PaginationDto, search?: string) {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.bank.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.bank.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneBank(companyId: string, id: string) {
    const bank = await this.prisma.bank.findFirst({
      where: { id, companyId },
      include: { agencies: true },
    });

    if (!bank) {
      throw new NotFoundException('Banco não encontrado');
    }

    return bank;
  }

  async updateBank(
    companyId: string,
    id: string,
    dto: Partial<CreateBankDto>,
    updatedBy: string,
  ) {
    const bank = await this.findOneBank(companyId, id);

    if (dto.code && dto.code !== bank.code) {
      const existing = await this.prisma.bank.findFirst({
        where: { companyId, code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Banco com este código já cadastrado');
      }
    }

    return this.prisma.bank.update({
      where: { id: bank.id },
      data: { ...dto, updatedBy },
    });
  }

  async removeBank(companyId: string, id: string) {
    const bank = await this.findOneBank(companyId, id);
    return this.prisma.bank.delete({ where: { id: bank.id } });
  }

  // ─── Bank Agencies ───────────────────────────────────────

  async createAgency(
    companyId: string,
    bankId: string,
    dto: CreateBankAgencyDto,
    createdBy: string,
  ) {
    await this.findOneBank(companyId, bankId);

    const existing = await this.prisma.bankAgency.findFirst({
      where: { bankId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Agência com este código já cadastrada');
    }

    return this.prisma.bankAgency.create({
      data: { bankId, ...dto, createdBy },
    });
  }

  async findAllAgencies(companyId: string, bankId: string) {
    await this.findOneBank(companyId, bankId);

    return this.prisma.bankAgency.findMany({
      where: { bankId },
      orderBy: { code: 'asc' },
    });
  }

  async findOneAgency(companyId: string, bankId: string, agencyId: string) {
    await this.findOneBank(companyId, bankId);

    const agency = await this.prisma.bankAgency.findFirst({
      where: { id: agencyId, bankId },
    });

    if (!agency) {
      throw new NotFoundException('Agência não encontrada');
    }

    return agency;
  }

  async updateAgency(
    companyId: string,
    bankId: string,
    agencyId: string,
    dto: Partial<CreateBankAgencyDto>,
    updatedBy: string,
  ) {
    await this.findOneAgency(companyId, bankId, agencyId);

    return this.prisma.bankAgency.update({
      where: { id: agencyId },
      data: { ...dto, updatedBy },
    });
  }

  async removeAgency(companyId: string, bankId: string, agencyId: string) {
    await this.findOneAgency(companyId, bankId, agencyId);
    return this.prisma.bankAgency.delete({ where: { id: agencyId } });
  }

  // ─── Own Bank Accounts ───────────────────────────────────

  async createOwnBankAccount(
    companyId: string,
    dto: CreateOwnBankAccountDto,
    createdBy: string,
  ) {
    await this.findOneBank(companyId, dto.bankId);

    const existing = await this.prisma.ownBankAccount.findFirst({
      where: {
        companyId,
        bankId: dto.bankId,
        agencyId: dto.agencyId,
        accountNumber: dto.accountNumber,
      },
    });

    if (existing) {
      throw new ConflictException('Conta bancária já cadastrada');
    }

    return this.prisma.ownBankAccount.create({
      data: { companyId, ...dto, createdBy },
    });
  }

  async findAllOwnBankAccounts(companyId: string) {
    return this.prisma.ownBankAccount.findMany({
      where: { companyId },
      include: { bank: true, agency: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOwnBankAccount(companyId: string, id: string) {
    const account = await this.prisma.ownBankAccount.findFirst({
      where: { id, companyId },
      include: { bank: true, agency: true },
    });

    if (!account) {
      throw new NotFoundException('Conta bancária não encontrada');
    }

    return account;
  }

  async updateOwnBankAccount(
    companyId: string,
    id: string,
    dto: Partial<CreateOwnBankAccountDto>,
    updatedBy: string,
  ) {
    const account = await this.findOneOwnBankAccount(companyId, id);

    return this.prisma.ownBankAccount.update({
      where: { id: account.id },
      data: { ...dto, updatedBy },
    });
  }

  async removeOwnBankAccount(companyId: string, id: string) {
    const account = await this.findOneOwnBankAccount(companyId, id);
    return this.prisma.ownBankAccount.delete({ where: { id: account.id } });
  }
}
