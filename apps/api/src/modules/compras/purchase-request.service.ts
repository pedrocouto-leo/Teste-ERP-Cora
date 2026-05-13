import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseRequestDto, ApprovePurchaseRequestDto } from './dto/purchase-request.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PurchaseRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreatePurchaseRequestDto, createdBy: string) {
    const totalEstimated = dto.items.reduce(
      (sum, item) => sum + (item.estimatedUnitPrice || 0) * item.quantity,
      0,
    );

    return this.prisma.purchaseRequest.create({
      data: {
        companyId,
        description: dto.description,
        needByDate: dto.needByDate ? new Date(dto.needByDate) : null,
        costCenterId: dto.costCenterId || null,
        projectId: dto.projectId || null,
        status: 'PENDING',
        totalEstimated,
        createdBy,
        items: {
          create: dto.items.map((item, index) => ({
            lineNumber: index + 1,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'UN',
            estimatedUnitPrice: item.estimatedUnitPrice || 0,
            productServiceCodeId: item.productServiceCodeId || null,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll(companyId: string, pagination: PaginationDto, filters: { status?: string; search?: string }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.description = { contains: filters.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { items: true },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(companyId: string, id: string) {
    const request = await this.prisma.purchaseRequest.findFirst({
      where: { id, companyId },
      include: { items: true, quotations: true },
    });
    if (!request) throw new NotFoundException('Solicitação de compra não encontrada');
    return request;
  }

  async approve(companyId: string, id: string, dto: ApprovePurchaseRequestDto, userId: string) {
    const request = await this.findOne(companyId, id);

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Solicitação não está pendente de aprovação');
    }
    if (request.createdBy === userId) {
      throw new BadRequestException('Maker/Checker: criador não pode aprovar');
    }

    const status = dto.action === 'approve' ? 'APPROVED' : 'REJECTED';
    return this.prisma.purchaseRequest.update({
      where: { id },
      data: { status, approvedBy: userId, approvedAt: new Date() },
      include: { items: true },
    });
  }
}
