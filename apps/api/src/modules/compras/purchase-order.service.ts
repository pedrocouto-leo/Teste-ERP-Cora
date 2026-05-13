import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, ApprovePurchaseOrderDto } from './dto/purchase-order.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreatePurchaseOrderDto, createdBy: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, companyId },
    });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
    if (supplier.status !== 'APPROVED') {
      throw new BadRequestException('Fornecedor não está aprovado');
    }

    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // Generate order number
    const lastOrder = await this.prisma.purchaseOrder.findFirst({
      where: { companyId },
      orderBy: { orderNumber: 'desc' },
    });
    const orderNumber = (lastOrder ? parseInt(lastOrder.orderNumber) + 1 : 1)
      .toString()
      .padStart(6, '0');

    return this.prisma.purchaseOrder.create({
      data: {
        companyId,
        orderNumber,
        supplierId: dto.supplierId,
        quotationId: dto.quotationId || null,
        purchaseRequestId: dto.purchaseRequestId || null,
        costCenterId: dto.costCenterId || null,
        projectId: dto.projectId || null,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
        paymentTerms: dto.paymentTerms || null,
        currencyCode: dto.currencyCode || 'BRL',
        totalAmount,
        status: 'DRAFT',
        createdBy,
        items: {
          create: dto.items.map((item, index) => ({
            lineNumber: index + 1,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'UN',
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            receivedQuantity: 0,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll(companyId: string, pagination: PaginationDto, filters: { status?: string; supplierId?: string; search?: string }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (filters.status) where.status = filters.status;
    if (filters.supplierId) where.supplierId = filters.supplierId;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { items: true },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido de compra não encontrado');
    return order;
  }

  async approve(companyId: string, id: string, dto: ApprovePurchaseOrderDto, userId: string) {
    const order = await this.findOne(companyId, id);
    if (order.status !== 'DRAFT' && order.status !== 'PENDING') {
      throw new BadRequestException('Pedido não está em estado válido para aprovação');
    }
    if (order.createdBy === userId) {
      throw new BadRequestException('Maker/Checker: criador não pode aprovar');
    }

    const status = dto.action === 'approve' ? 'APPROVED' : 'REJECTED';
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status, approvedBy: userId, approvedAt: new Date() },
      include: { items: true },
    });
  }

  async submit(companyId: string, id: string) {
    const order = await this.findOne(companyId, id);
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Pedido deve estar em DRAFT para submeter');
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'PENDING' },
      include: { items: true },
    });
  }
}
