import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto, SelectQuotationDto } from './dto/quotation.dto';

@Injectable()
export class QuotationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateQuotationDto, createdBy: string) {
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity - (item.discount || 0),
      0,
    );

    return this.prisma.quotation.create({
      data: {
        companyId,
        purchaseRequestId: dto.purchaseRequestId,
        supplierId: dto.supplierId,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        paymentTerms: dto.paymentTerms || null,
        deliveryTerms: dto.deliveryTerms || null,
        deliveryDays: dto.deliveryDays || null,
        totalAmount,
        status: 'PENDING',
        createdBy,
        items: {
          create: dto.items.map((item, index) => ({
            lineNumber: index + 1,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'UN',
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            totalPrice: item.unitPrice * item.quantity - (item.discount || 0),
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll(companyId: string, purchaseRequestId?: string) {
    const where: Record<string, unknown> = { companyId };
    if (purchaseRequestId) where.purchaseRequestId = purchaseRequestId;

    return this.prisma.quotation.findMany({
      where,
      include: { items: true },
      orderBy: { totalAmount: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, companyId },
      include: { items: true },
    });
    if (!quotation) throw new NotFoundException('Cotação não encontrada');
    return quotation;
  }

  async select(companyId: string, id: string, dto: SelectQuotationDto, userId: string) {
    const quotation = await this.findOne(companyId, id);
    if (quotation.status !== 'PENDING') {
      throw new BadRequestException('Cotação não está pendente');
    }

    const status = dto.action === 'select' ? 'SELECTED' : 'REJECTED';
    return this.prisma.quotation.update({
      where: { id },
      data: { status, selectedBy: userId, selectedAt: new Date() },
      include: { items: true },
    });
  }

  async compare(companyId: string, purchaseRequestId: string) {
    const quotations = await this.prisma.quotation.findMany({
      where: { companyId, purchaseRequestId },
      include: { items: true },
      orderBy: { totalAmount: 'asc' },
    });

    return {
      quotations,
      bestPrice: quotations[0] || null,
      count: quotations.length,
    };
  }
}
