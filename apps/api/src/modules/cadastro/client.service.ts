import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { isValidCPFOrCNPJ } from '@cora-erp/shared';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateClientDto, createdBy: string) {
    if (!isValidCPFOrCNPJ(dto.cpfCnpj)) {
      throw new BadRequestException('CPF/CNPJ inválido');
    }

    const existing = await this.prisma.client.findFirst({
      where: { companyId, cpfCnpj: dto.cpfCnpj },
    });

    if (existing) {
      throw new ConflictException('Cliente com este CPF/CNPJ já cadastrado');
    }

    return this.prisma.client.create({
      data: {
        companyId,
        ...dto,
        createdBy,
      },
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    search?: string,
  ) {
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpfCnpj: { contains: search } },
        { tradeName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return client;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateClientDto,
    updatedBy: string,
  ) {
    const client = await this.findOne(companyId, id);

    return this.prisma.client.update({
      where: { id: client.id },
      data: { ...dto, updatedBy },
    });
  }

  async remove(companyId: string, id: string) {
    const client = await this.findOne(companyId, id);

    return this.prisma.client.delete({
      where: { id: client.id },
    });
  }
}
