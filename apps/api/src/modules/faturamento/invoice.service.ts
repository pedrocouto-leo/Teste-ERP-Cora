import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    dto: CreateInvoiceDto,
    createdBy: string,
  ) {
    // Validate client exists and belongs to this company
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, companyId },
    });

    if (!client) {
      throw new BadRequestException('Cliente nao encontrado nesta empresa');
    }

    // Calculate item totals
    const itemsData = dto.items.map((item, index) => {
      const quantity = new Decimal(item.quantity);
      const unitPrice = new Decimal(item.unitPrice);
      const totalPrice = quantity.mul(unitPrice);

      return {
        sequence: index + 1,
        description: item.description,
        serviceCode: item.serviceCode ?? null,
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    // Calculate subtotal (sum of all item totals)
    const subtotal = itemsData.reduce(
      (sum, item) => sum.add(item.totalPrice),
      new Decimal(0),
    );

    // Calculate taxes
    let taxTotal = new Decimal(0);
    const taxesData = (dto.taxes ?? []).map((tax) => {
      const baseAmount = new Decimal(tax.baseAmount);
      const rate = new Decimal(tax.rate);
      const amount = baseAmount.mul(rate).div(100);
      taxTotal = taxTotal.add(amount);

      return {
        taxType: tax.taxType,
        baseAmount,
        rate,
        amount,
        withheld: tax.withheld ?? false,
      };
    });

    // totalAmount = subtotal + taxTotal (non-withheld) - withheld taxes
    const withheldTotal = taxesData
      .filter((t) => t.withheld)
      .reduce((sum, t) => sum.add(t.amount), new Decimal(0));
    const totalAmount = subtotal.add(taxTotal).sub(withheldTotal);

    // Auto-generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(companyId);

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          companyId,
          invoiceNumber,
          clientId: dto.clientId,
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          description: dto.description ?? null,
          subtotal,
          taxTotal,
          totalAmount,
          currencyCode: dto.currencyCode ?? 'BRL',
          costCenterId: dto.costCenterId ?? null,
          projectId: dto.projectId ?? null,
          createdBy,
          items: {
            create: itemsData,
          },
          taxes: {
            create: taxesData,
          },
        },
        include: {
          items: true,
          taxes: true,
        },
      });

      return invoice;
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    filters?: {
      status?: string;
      clientId?: string;
      nfseStatus?: string;
      issueDateFrom?: string;
      issueDateTo?: string;
    },
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'issueDate',
      sortOrder = 'desc',
    } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId, active: true };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.nfseStatus) {
      where.nfseStatus = filters.nfseStatus;
    }

    if (filters?.issueDateFrom || filters?.issueDateTo) {
      const issueDateFilter: Record<string, Date> = {};
      if (filters.issueDateFrom)
        issueDateFilter.gte = new Date(filters.issueDateFrom);
      if (filters.issueDateTo)
        issueDateFilter.lte = new Date(filters.issueDateTo);
      where.issueDate = issueDateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId, active: true },
      include: {
        items: { orderBy: { sequence: 'asc' } },
        taxes: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura nao encontrada');
    }

    return invoice;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateInvoiceDto,
    updatedBy: string,
  ) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(
        'Somente faturas com status DRAFT podem ser alteradas',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // If items are provided, recalculate everything
      if (dto.items && dto.items.length > 0) {
        // Delete existing items
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

        // Create new items
        const itemsData = dto.items.map((item, index) => {
          const quantity = new Decimal(item.quantity ?? 0);
          const unitPrice = new Decimal(item.unitPrice ?? 0);
          const totalPrice = quantity.mul(unitPrice);

          return {
            invoiceId: id,
            sequence: index + 1,
            description: item.description ?? '',
            serviceCode: item.serviceCode ?? null,
            quantity,
            unitPrice,
            totalPrice,
          };
        });

        await tx.invoiceItem.createMany({ data: itemsData });
      }

      // If taxes are provided, recalculate
      if (dto.taxes) {
        await tx.invoiceTax.deleteMany({ where: { invoiceId: id } });

        if (dto.taxes.length > 0) {
          const taxesData = dto.taxes.map((tax) => {
            const baseAmount = new Decimal(tax.baseAmount ?? 0);
            const rate = new Decimal(tax.rate ?? 0);
            const amount = baseAmount.mul(rate).div(100);

            return {
              invoiceId: id,
              taxType: tax.taxType ?? '',
              baseAmount,
              rate,
              amount,
              withheld: tax.withheld ?? false,
            };
          });

          await tx.invoiceTax.createMany({ data: taxesData });
        }
      }

      // Recalculate totals if items or taxes changed
      const currentItems = await tx.invoiceItem.findMany({
        where: { invoiceId: id },
      });
      const currentTaxes = await tx.invoiceTax.findMany({
        where: { invoiceId: id },
      });

      const subtotal = currentItems.reduce(
        (sum, item) => sum.add(new Decimal(item.totalPrice.toString())),
        new Decimal(0),
      );

      const taxTotal = currentTaxes.reduce(
        (sum, tax) => sum.add(new Decimal(tax.amount.toString())),
        new Decimal(0),
      );

      const withheldTotal = currentTaxes
        .filter((t) => t.withheld)
        .reduce(
          (sum, t) => sum.add(new Decimal(t.amount.toString())),
          new Decimal(0),
        );

      const totalAmount = subtotal.add(taxTotal).sub(withheldTotal);

      const data: Record<string, unknown> = {
        subtotal,
        taxTotal,
        totalAmount,
        updatedBy,
      };

      if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.currencyCode !== undefined) data.currencyCode = dto.currencyCode;
      if (dto.costCenterId !== undefined) data.costCenterId = dto.costCenterId;
      if (dto.projectId !== undefined) data.projectId = dto.projectId;

      return tx.invoice.update({
        where: { id },
        data,
        include: {
          items: { orderBy: { sequence: 'asc' } },
          taxes: true,
        },
      });
    });
  }

  async issue(companyId: string, id: string, updatedBy: string) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(
        'Somente faturas com status DRAFT podem ser emitidas',
      );
    }

    if (invoice.items.length === 0) {
      throw new BadRequestException(
        'A fatura deve possuir ao menos um item para ser emitida',
      );
    }

    // Transition to ISSUED and optionally generate receivable title
    return this.prisma.$transaction(async (tx) => {
      // Create receivable title from the invoice
      const receivable = await tx.receivableTitle.create({
        data: {
          companyId,
          clientId: invoice.clientId,
          titleNumber: invoice.invoiceNumber,
          installment: 1,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          originalAmount: invoice.totalAmount,
          netAmount: invoice.totalAmount,
          balance: invoice.totalAmount,
          currencyCode: invoice.currencyCode,
          description: `Fatura ${invoice.invoiceNumber}`,
          source: 'FATURAMENTO',
          sourceId: invoice.id,
          createdBy: updatedBy,
        },
      });

      const updated = await tx.invoice.update({
        where: { id },
        data: {
          status: 'ISSUED',
          receivableId: receivable.id,
          updatedBy,
        },
        include: {
          items: { orderBy: { sequence: 'asc' } },
          taxes: true,
        },
      });

      return { ...updated, receivableId: receivable.id };
    });
  }

  async cancel(companyId: string, id: string, updatedBy: string) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Fatura ja esta cancelada');
    }

    return this.prisma.$transaction(async (tx) => {
      // If the invoice was ISSUED and has a receivable, cancel it
      if (invoice.receivableId) {
        await tx.receivableTitle.update({
          where: { id: invoice.receivableId },
          data: {
            status: 'CANCELLED',
            updatedBy,
          },
        });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedBy,
        },
        include: {
          items: { orderBy: { sequence: 'asc' } },
          taxes: true,
        },
      });
    });
  }

  async calculateTaxes(
    companyId: string,
    id: string,
    updatedBy: string,
  ) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(
        'Somente faturas com status DRAFT podem ter impostos recalculados',
      );
    }

    const subtotal = new Decimal(invoice.subtotal.toString());

    // Default tax rates for services (Brazilian standard rates)
    const defaultTaxes = [
      { taxType: 'ISS', rate: new Decimal('5.0000'), withheld: false },
      { taxType: 'IR', rate: new Decimal('1.5000'), withheld: true },
      { taxType: 'CSLL', rate: new Decimal('1.0000'), withheld: true },
      { taxType: 'PIS', rate: new Decimal('0.6500'), withheld: true },
      { taxType: 'COFINS', rate: new Decimal('3.0000'), withheld: true },
    ];

    const taxesData = defaultTaxes.map((tax) => {
      const amount = subtotal.mul(tax.rate).div(100);
      return {
        invoiceId: id,
        taxType: tax.taxType,
        baseAmount: subtotal,
        rate: tax.rate,
        amount,
        withheld: tax.withheld,
      };
    });

    return this.prisma.$transaction(async (tx) => {
      // Remove existing taxes
      await tx.invoiceTax.deleteMany({ where: { invoiceId: id } });

      // Create new calculated taxes
      await tx.invoiceTax.createMany({ data: taxesData });

      const allTaxes = await tx.invoiceTax.findMany({
        where: { invoiceId: id },
      });

      const taxTotal = allTaxes.reduce(
        (sum, t) => sum.add(new Decimal(t.amount.toString())),
        new Decimal(0),
      );

      const withheldTotal = allTaxes
        .filter((t) => t.withheld)
        .reduce(
          (sum, t) => sum.add(new Decimal(t.amount.toString())),
          new Decimal(0),
        );

      const totalAmount = subtotal.add(taxTotal).sub(withheldTotal);

      return tx.invoice.update({
        where: { id },
        data: {
          taxTotal,
          totalAmount,
          updatedBy,
        },
        include: {
          items: { orderBy: { sequence: 'asc' } },
          taxes: true,
        },
      });
    });
  }

  private async generateInvoiceNumber(companyId: string): Promise<string> {
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { companyId },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    if (!lastInvoice) {
      return 'FAT-000001';
    }

    const lastNumber = lastInvoice.invoiceNumber;
    const match = lastNumber.match(/FAT-(\d+)/);
    if (match) {
      const nextNumber = parseInt(match[1], 10) + 1;
      return `FAT-${nextNumber.toString().padStart(6, '0')}`;
    }

    // Fallback: count-based
    const count = await this.prisma.invoice.count({ where: { companyId } });
    return `FAT-${(count + 1).toString().padStart(6, '0')}`;
  }
}
