import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  ApproveSupplierDto,
} from './dto/supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { isValidCPFOrCNPJ } from '@cora-erp/shared';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateSupplierDto, createdBy: string) {
    // Validate CPF/CNPJ
    if (!isValidCPFOrCNPJ(dto.cpfCnpj)) {
      throw new BadRequestException('CPF/CNPJ inválido');
    }

    const existing = await this.prisma.supplier.findFirst({
      where: { companyId, cpfCnpj: dto.cpfCnpj },
    });

    if (existing) {
      throw new ConflictException('Fornecedor com este CPF/CNPJ já cadastrado');
    }

    return this.prisma.supplier.create({
      data: {
        companyId,
        ...dto,
        status: 'PENDING',
        createdBy,
      },
    });
  }

  async findAll(companyId: string, pagination: PaginationDto, search?: string, status?: string) {
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
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    return supplier;
  }

  async update(companyId: string, id: string, dto: UpdateSupplierDto, updatedBy: string) {
    const supplier = await this.findOne(companyId, id);

    return this.prisma.supplier.update({
      where: { id: supplier.id },
      data: { ...dto, updatedBy, status: 'PENDING' },
    });
  }

  async approve(companyId: string, id: string, dto: ApproveSupplierDto, approvedBy: string) {
    const supplier = await this.findOne(companyId, id);

    if (supplier.status !== 'PENDING') {
      throw new BadRequestException('Fornecedor não está pendente de aprovação');
    }

    if (supplier.createdBy === approvedBy) {
      throw new BadRequestException(
        'Maker/Checker: o mesmo usuário que criou não pode aprovar',
      );
    }

    const status = dto.action === 'approve' ? 'APPROVED' : 'REJECTED';

    return this.prisma.supplier.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }
}
