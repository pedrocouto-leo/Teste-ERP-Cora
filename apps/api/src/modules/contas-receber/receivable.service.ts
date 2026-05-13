import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { ReceivePaymentDto } from './dto/receive-payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ReceivableService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    dto: CreateReceivableDto,
    createdBy: string,
  ) {
    // Validate client exists and belongs to this company
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, companyId },
    });

    if (!client) {
      throw new BadRequestException('Cliente nao encontrado nesta empresa');
    }

    const originalAmount = new Decimal(dto.originalAmount);
    const netAmount = originalAmount;
    const balance = netAmount;

    return this.prisma.receivableTitle.create({
      data: {
        companyId,
        clientId: dto.clientId,
        titleNumber: dto.titleNumber,
        installment: dto.installment ?? 1,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        originalAmount,
        netAmount,
        balance,
        currencyCode: dto.currencyCode ?? 'BRL',
        description: dto.description ?? null,
        nfNumber: dto.nfNumber ?? null,
        createdBy,
      },
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    filters?: {
      status?: string;
      clientId?: string;
      dueDateFrom?: string;
      dueDateTo?: string;
      overdue?: string;
    },
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.dueDateFrom || filters?.dueDateTo) {
      const dueDateFilter: Record<string, Date> = {};
      if (filters.dueDateFrom)
        dueDateFilter.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) dueDateFilter.lte = new Date(filters.dueDateTo);
      where.dueDate = dueDateFilter;
    }

    if (filters?.overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { in: ['OPEN', 'PARTIAL'] };
    }

    const [data, total] = await Promise.all([
      this.prisma.receivableTitle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.receivableTitle.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const title = await this.prisma.receivableTitle.findFirst({
      where: { id, companyId },
      include: {
        boletos: true,
        negotiations: true,
      },
    });

    if (!title) {
      throw new NotFoundException('Titulo a receber nao encontrado');
    }

    return title;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateReceivableDto,
    updatedBy: string,
  ) {
    const title = await this.findOne(companyId, id);

    if (title.status === 'PAID' || title.status === 'CANCELLED') {
      throw new BadRequestException(
        `Titulo com status ${title.status} nao pode ser alterado`,
      );
    }

    const data: Record<string, unknown> = { updatedBy };

    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.nfNumber !== undefined) data.nfNumber = dto.nfNumber;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.receivableTitle.update({
      where: { id: title.id },
      data,
    });
  }

  async receivePayment(
    companyId: string,
    id: string,
    dto: ReceivePaymentDto,
    userId: string,
  ) {
    const title = await this.findOne(companyId, id);

    if (title.status === 'PAID' || title.status === 'CANCELLED') {
      throw new BadRequestException(
        `Titulo com status ${title.status} nao pode receber pagamento`,
      );
    }

    const paymentAmount = new Decimal(dto.amount);
    const currentBalance = new Decimal(title.balance.toString());

    if (paymentAmount.gt(currentBalance)) {
      throw new BadRequestException(
        `Valor do pagamento (${paymentAmount}) excede o saldo do titulo (${currentBalance})`,
      );
    }

    const newReceivedAmount = new Decimal(
      title.receivedAmount.toString(),
    ).add(paymentAmount);
    const newBalance = currentBalance.sub(paymentAmount);

    let newStatus: string;
    if (newBalance.eq(0)) {
      newStatus = 'PAID';
    } else {
      newStatus = 'PARTIAL';
    }

    return this.prisma.receivableTitle.update({
      where: { id: title.id },
      data: {
        receivedAmount: newReceivedAmount,
        balance: newBalance,
        status: newStatus,
        updatedBy: userId,
      },
    });
  }

  async markOverdue(companyId: string) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = await this.prisma.receivableTitle.updateMany({
      where: {
        companyId,
        dueDate: { lt: now },
        status: { in: ['OPEN', 'PARTIAL'] },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    return {
      updatedCount: result.count,
      message: `${result.count} titulo(s) marcado(s) como vencido(s)`,
    };
  }
}
