import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/holiday.dto';

@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    dto: CreateHolidayDto,
    _createdBy: string,
  ) {
    const existing = await this.prisma.holiday.findFirst({
      where: {
        companyId,
        date: new Date(dto.date),
        scope: dto.scope,
        state: dto.state ?? null,
        municipalityCode: dto.municipalityCode ?? null,
      },
    });

    if (existing) {
      throw new ConflictException('Feriado já cadastrado para esta data e escopo');
    }

    return this.prisma.holiday.create({
      data: {
        companyId,
        date: new Date(dto.date),
        description: dto.description,
        scope: dto.scope,
        state: dto.state,
        municipalityCode: dto.municipalityCode,
      },
    });
  }

  async findAll(
    companyId: string,
    year?: number,
    scope?: string,
    state?: string,
  ) {
    const where: Record<string, unknown> = { companyId };

    if (year) {
      where.date = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    if (scope) where.scope = scope;
    if (state) where.state = state;

    return this.prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const holiday = await this.prisma.holiday.findFirst({
      where: { id, companyId },
    });

    if (!holiday) {
      throw new NotFoundException('Feriado não encontrado');
    }

    return holiday;
  }

  async update(
    companyId: string,
    id: string,
    dto: Partial<CreateHolidayDto>,
    _updatedBy: string,
  ) {
    const holiday = await this.findOne(companyId, id);

    const data: Record<string, unknown> = { ...dto };
    if (dto.date) {
      data.date = new Date(dto.date);
    }

    return this.prisma.holiday.update({
      where: { id: holiday.id },
      data,
    });
  }

  async remove(companyId: string, id: string) {
    const holiday = await this.findOne(companyId, id);
    return this.prisma.holiday.delete({ where: { id: holiday.id } });
  }
}
