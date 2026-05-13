import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCurrencyDto,
  CreateExchangeRateDto,
} from './dto/currency.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Currencies (global registry) ────────────────────────

  async create(
    _companyId: string,
    dto: CreateCurrencyDto,
    _createdBy: string,
  ) {
    const existing = await this.prisma.currency.findFirst({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Moeda com este código já cadastrada');
    }

    return this.prisma.currency.create({
      data: {
        code: dto.code,
        name: dto.name,
        symbol: dto.symbol ?? dto.code,
        decimals: dto.decimalPlaces ?? 2,
      },
    });
  }

  async findAll(_companyId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.CurrencyWhereInput = {};

    const [data, total] = await Promise.all([
      this.prisma.currency.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.currency.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(_companyId: string, id: string) {
    const currency = await this.prisma.currency.findFirst({
      where: { id },
    });

    if (!currency) {
      throw new NotFoundException('Moeda não encontrada');
    }

    return currency;
  }

  async update(
    companyId: string,
    id: string,
    dto: Partial<CreateCurrencyDto>,
    _updatedBy: string,
  ) {
    const currency = await this.findOne(companyId, id);

    if (dto.code && dto.code !== currency.code) {
      const existing = await this.prisma.currency.findFirst({
        where: { code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Moeda com este código já cadastrada');
      }
    }

    return this.prisma.currency.update({
      where: { id: currency.id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.symbol !== undefined && { symbol: dto.symbol }),
        ...(dto.decimalPlaces !== undefined && { decimals: dto.decimalPlaces }),
      },
    });
  }

  async remove(companyId: string, id: string) {
    const currency = await this.findOne(companyId, id);
    return this.prisma.currency.delete({ where: { id: currency.id } });
  }

  // ─── Exchange Rates ──────────────────────────────────────

  async createExchangeRate(
    companyId: string,
    currencyId: string,
    dto: CreateExchangeRateDto,
    _createdBy: string,
  ) {
    await this.findOne(companyId, currencyId);

    const existing = await this.prisma.exchangeRate.findFirst({
      where: { currencyId, date: new Date(dto.date) },
    });

    if (existing) {
      throw new ConflictException('Taxa de câmbio para esta data já cadastrada');
    }

    return this.prisma.exchangeRate.create({
      data: {
        currencyId,
        date: new Date(dto.date),
        buyRate: dto.rate,
        sellRate: dto.sellRate ?? dto.rate,
      },
    });
  }

  async findAllExchangeRates(
    companyId: string,
    currencyId: string,
    startDate?: string,
    endDate?: string,
  ) {
    await this.findOne(companyId, currencyId);

    const where: Prisma.ExchangeRateWhereInput = { currencyId };

    if (startDate || endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.date = dateFilter;
    }

    return this.prisma.exchangeRate.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async removeExchangeRate(
    companyId: string,
    currencyId: string,
    rateId: string,
  ) {
    await this.findOne(companyId, currencyId);

    const rate = await this.prisma.exchangeRate.findFirst({
      where: { id: rateId, currencyId },
    });

    if (!rate) {
      throw new NotFoundException('Taxa de câmbio não encontrada');
    }

    return this.prisma.exchangeRate.delete({ where: { id: rateId } });
  }
}
