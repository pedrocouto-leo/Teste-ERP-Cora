import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCurrencyDto,
  CreateExchangeRateDto,
} from './dto/currency.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Currencies ──────────────────────────────────────────

  async create(
    companyId: string,
    dto: CreateCurrencyDto,
    createdBy: string,
  ) {
    const existing = await this.prisma.currency.findFirst({
      where: { companyId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Moeda com este código já cadastrada');
    }

    return this.prisma.currency.create({
      data: { companyId, ...dto, createdBy },
    });
  }

  async findAll(companyId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where = { companyId };

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

  async findOne(companyId: string, id: string) {
    const currency = await this.prisma.currency.findFirst({
      where: { id, companyId },
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
    updatedBy: string,
  ) {
    const currency = await this.findOne(companyId, id);

    if (dto.code && dto.code !== currency.code) {
      const existing = await this.prisma.currency.findFirst({
        where: { companyId, code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Moeda com este código já cadastrada');
      }
    }

    return this.prisma.currency.update({
      where: { id: currency.id },
      data: { ...dto, updatedBy },
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
    createdBy: string,
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
        rate: dto.rate,
        sellRate: dto.sellRate,
        createdBy,
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

    const where: Record<string, unknown> = { currencyId };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
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
