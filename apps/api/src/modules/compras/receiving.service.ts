import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceivingDto } from './dto/receiving.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ReceivingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateReceivingDto, createdBy: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, companyId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Pedido de compra não encontrado');
    if (order.status !== 'APPROVED') {
      throw new BadRequestException('Pedido deve estar aprovado para recebimento');
    }

    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantityReceived,
      0,
    );

    // Generate receiving number
    const lastReceiving = await this.prisma.receiving.findFirst({
      where: { companyId },
      orderBy: { receivingNumber: 'desc' },
    });
    const receivingNumber = (lastReceiving ? parseInt(lastReceiving.receivingNumber) + 1 : 1)
      .toString()
      .padStart(6, '0');

    return this.prisma.$transaction(async (tx) => {
      // Create receiving
      const receiving = await tx.receiving.create({
        data: {
          companyId,
          receivingNumber,
          purchaseOrderId: dto.purchaseOrderId,
          receivingDate: new Date(dto.receivingDate),
          nfNumber: dto.nfNumber || null,
          nfSeries: dto.nfSeries || null,
          nfAccessKey: dto.nfAccessKey || null,
          totalAmount,
          status: 'RECEIVED',
          comments: dto.comments || null,
          createdBy,
          items: {
            create: dto.items.map((item, index) => ({
              lineNumber: index + 1,
              description: item.description,
              quantityReceived: item.quantityReceived,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantityReceived,
              unit: item.unit || 'UN',
              orderItemId: item.orderItemId || null,
            })),
          },
        },
        include: { items: true },
      });

      // Update order item received quantities
      for (const item of dto.items) {
        if (item.orderItemId) {
          await tx.purchaseOrderItem.update({
            where: { id: item.orderItemId },
            data: {
              receivedQuantity: { increment: item.quantityReceived },
            },
          });
        }
      }

      // Check if all items are fully received and update order status
      const updatedOrder = await tx.purchaseOrder.findUnique({
        where: { id: dto.purchaseOrderId },
        include: { items: true },
      });

      if (updatedOrder) {
        const allReceived = updatedOrder.items.every(
          (item) => Number(item.receivedQuantity) >= Number(item.quantity),
        );
        if (allReceived) {
          await tx.purchaseOrder.update({
            where: { id: dto.purchaseOrderId },
            data: { status: 'RECEIVED' },
          });
        } else {
          await tx.purchaseOrder.update({
            where: { id: dto.purchaseOrderId },
            data: { status: 'PARTIAL_RECEIVED' },
          });
        }
      }

      return receiving;
    });
  }

  async findAll(companyId: string, pagination: PaginationDto, filters: { status?: string; orderId?: string }) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };
    if (filters.status) where.status = filters.status;
    if (filters.orderId) where.purchaseOrderId = filters.orderId;

    const [data, total] = await Promise.all([
      this.prisma.receiving.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { items: true },
      }),
      this.prisma.receiving.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(companyId: string, id: string) {
    const receiving = await this.prisma.receiving.findFirst({
      where: { id, companyId },
      include: { items: true },
    });
    if (!receiving) throw new NotFoundException('Recebimento não encontrado');
    return receiving;
  }
}
