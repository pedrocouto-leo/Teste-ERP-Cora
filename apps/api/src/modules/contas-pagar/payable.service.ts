import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaxCalculatorService } from './tax-calculator.service';
import { CreatePayableDto } from './dto/create-payable.dto';
import { UpdatePayableDto } from './dto/update-payable.dto';
import { ApprovePayableDto } from './dto/approve-payable.dto';
import { ProcessPaymentDto } from './dto/payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PayableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxCalculator: TaxCalculatorService,
  ) {}

  async create(companyId: string, dto: CreatePayableDto, createdBy: string) {
    // Validate supplier exists and belongs to company
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, companyId, active: true },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado ou inativo');
    }

    // Validate cost allocation percentages sum to 100%
    const totalPercentage = dto.costAllocations.reduce(
      (sum, ca) => sum + ca.percentage,
      0,
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new BadRequestException(
        'A soma dos percentuais de rateio deve ser 100%',
      );
    }

    // Calculate net amount: original - withheld taxes
    const taxes = dto.taxes || [];
    const withheldTotal = taxes
      .filter((t) => t.withheld !== false)
      .reduce((sum, t) => sum + t.amount, 0);
    const netAmount = dto.originalAmount - withheldTotal;

    if (netAmount <= 0) {
      throw new BadRequestException(
        'O valor líquido deve ser maior que zero',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const title = await tx.payableTitle.create({
        data: {
          companyId,
          supplierId: dto.supplierId,
          titleNumber: dto.titleNumber,
          installment: dto.installment ?? 1,
          issueDate: new Date(dto.issueDate),
          dueDate: new Date(dto.dueDate),
          originalAmount: dto.originalAmount,
          netAmount,
          balance: netAmount,
          paidAmount: 0,
          currencyCode: dto.currencyCode ?? 'BRL',
          paymentMethod: dto.paymentMethod,
          barcode: dto.barcode,
          description: dto.description,
          nfNumber: dto.nfNumber,
          nfSeries: dto.nfSeries,
          sourceModule: 'MANUAL',
          status: 'OPEN',
          approvalStatus: 'PENDING',
          createdBy,
          costAllocations: {
            createMany: {
              data: dto.costAllocations.map((ca) => ({
                costCenterId: ca.costCenterId,
                projectId: ca.projectId,
                branchId: ca.branchId,
                percentage: ca.percentage,
                amount: ca.amount,
              })),
            },
          },
          taxes: taxes.length > 0
            ? {
                createMany: {
                  data: taxes.map((t) => ({
                    taxType: t.taxType,
                    baseAmount: t.baseAmount,
                    rate: t.rate,
                    amount: t.amount,
                    withheld: t.withheld ?? true,
                  })),
                },
              }
            : undefined,
        },
        include: {
          costAllocations: true,
          taxes: true,
        },
      });

      return title;
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    filters: {
      status?: string;
      approvalStatus?: string;
      supplierId?: string;
      dueDateFrom?: string;
      dueDateTo?: string;
      overdue?: boolean;
    },
  ) {
    const { page = 1, limit = 20, sortBy = 'dueDate', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.approvalStatus) where.approvalStatus = filters.approvalStatus;
    if (filters.supplierId) where.supplierId = filters.supplierId;

    if (filters.dueDateFrom || filters.dueDateTo) {
      const dueDateFilter: Record<string, Date> = {};
      if (filters.dueDateFrom) dueDateFilter.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) dueDateFilter.lte = new Date(filters.dueDateTo);
      where.dueDate = dueDateFilter;
    }

    if (filters.overdue) {
      where.status = { in: ['OPEN', 'PARTIAL'] };
      where.dueDate = { lt: new Date() };
    }

    const [data, total] = await Promise.all([
      this.prisma.payableTitle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.payableTitle.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const title = await this.prisma.payableTitle.findFirst({
      where: { id, companyId },
      include: {
        costAllocations: true,
        taxes: true,
        approvals: { orderBy: { step: 'asc' } },
      },
    });

    if (!title) {
      throw new NotFoundException('Título a pagar não encontrado');
    }

    return title;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdatePayableDto,
    updatedBy: string,
  ) {
    const title = await this.findOne(companyId, id);

    if (title.approvalStatus !== 'PENDING') {
      throw new BadRequestException(
        'Somente títulos com aprovação pendente podem ser alterados',
      );
    }

    // If cost allocations are being updated, validate percentage sum
    if (dto.costAllocations) {
      const totalPercentage = dto.costAllocations.reduce(
        (sum, ca) => sum + ca.percentage,
        0,
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new BadRequestException(
          'A soma dos percentuais de rateio deve ser 100%',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Build the update data
      const updateData: Record<string, unknown> = { updatedBy };

      if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
      if (dto.paymentMethod !== undefined) updateData.paymentMethod = dto.paymentMethod;
      if (dto.barcode !== undefined) updateData.barcode = dto.barcode;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.nfNumber !== undefined) updateData.nfNumber = dto.nfNumber;
      if (dto.nfSeries !== undefined) updateData.nfSeries = dto.nfSeries;

      // Recalculate amounts if originalAmount or taxes change
      if (dto.originalAmount !== undefined || dto.taxes) {
        const originalAmount = dto.originalAmount ?? Number(title.originalAmount);
        const taxes = dto.taxes ?? title.taxes.map((t) => ({
          taxType: t.taxType,
          baseAmount: Number(t.baseAmount),
          rate: Number(t.rate),
          amount: Number(t.amount),
          withheld: t.withheld,
        }));
        const withheldTotal = taxes
          .filter((t) => t.withheld !== false)
          .reduce((sum, t) => sum + t.amount, 0);
        const netAmount = originalAmount - withheldTotal;

        if (netAmount <= 0) {
          throw new BadRequestException('O valor líquido deve ser maior que zero');
        }

        updateData.originalAmount = originalAmount;
        updateData.netAmount = netAmount;
        updateData.balance = netAmount - Number(title.paidAmount);
      }

      // Replace cost allocations if provided
      if (dto.costAllocations) {
        await tx.payableCostAllocation.deleteMany({ where: { titleId: id } });
        await tx.payableCostAllocation.createMany({
          data: dto.costAllocations.map((ca) => ({
            titleId: id,
            costCenterId: ca.costCenterId,
            projectId: ca.projectId,
            branchId: ca.branchId,
            percentage: ca.percentage,
            amount: ca.amount,
          })),
        });
      }

      // Replace taxes if provided
      if (dto.taxes) {
        await tx.payableTax.deleteMany({ where: { titleId: id } });
        await tx.payableTax.createMany({
          data: dto.taxes.map((t) => ({
            titleId: id,
            taxType: t.taxType,
            baseAmount: t.baseAmount,
            rate: t.rate,
            amount: t.amount,
            withheld: t.withheld ?? true,
          })),
        });
      }

      return tx.payableTitle.update({
        where: { id },
        data: updateData,
        include: {
          costAllocations: true,
          taxes: true,
        },
      });
    });
  }

  async approve(
    companyId: string,
    id: string,
    dto: ApprovePayableDto,
    userId: string,
  ) {
    const title = await this.findOne(companyId, id);

    if (title.approvalStatus === 'APPROVED') {
      throw new BadRequestException('Título já foi aprovado');
    }

    if (title.approvalStatus === 'REJECTED' && dto.action === 'approve') {
      throw new BadRequestException(
        'Título rejeitado não pode ser aprovado diretamente. Crie um novo.',
      );
    }

    // Maker/Checker: creator cannot approve
    if (title.createdBy === userId) {
      throw new ForbiddenException(
        'Maker/Checker: o usuário que criou o título não pode aprová-lo',
      );
    }

    // Determine current approval step
    const lastApproval = await this.prisma.payableApproval.findFirst({
      where: { titleId: id },
      orderBy: { step: 'desc' },
    });

    const currentStep = (lastApproval?.step ?? 0) + 1;

    if (currentStep > 4) {
      throw new BadRequestException('Máximo de 4 etapas de aprovação atingido');
    }

    // Check user hasn't already approved this title
    const existingApproval = await this.prisma.payableApproval.findFirst({
      where: { titleId: id, userId },
    });

    if (existingApproval) {
      throw new BadRequestException('Usuário já registrou aprovação para este título');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create approval record
      await tx.payableApproval.create({
        data: {
          titleId: id,
          step: currentStep,
          userId,
          action: dto.action === 'approve' ? 'APPROVED' : 'REJECTED',
          comments: dto.comments,
        },
      });

      // Determine new approval status
      let approvalStatus: string;
      if (dto.action === 'reject') {
        approvalStatus = 'REJECTED';
      } else {
        // Approved: check if this is a sufficient approval step
        // For amounts >= 100,000 require 2 approvals, otherwise 1 is enough
        const requiredSteps = new Decimal(title.originalAmount).gte(100000) ? 2 : 1;
        approvalStatus = currentStep >= requiredSteps ? 'APPROVED' : 'PENDING';
      }

      const updateData: Record<string, unknown> = { approvalStatus };
      if (approvalStatus === 'APPROVED') {
        updateData.approvedBy = userId;
        updateData.approvedAt = new Date();
      }

      return tx.payableTitle.update({
        where: { id },
        data: updateData,
        include: {
          costAllocations: true,
          taxes: true,
          approvals: { orderBy: { step: 'asc' } },
        },
      });
    });
  }

  async processPayment(
    companyId: string,
    id: string,
    dto: ProcessPaymentDto,
    userId: string,
  ) {
    const title = await this.findOne(companyId, id);

    if (title.approvalStatus !== 'APPROVED') {
      throw new BadRequestException(
        'Somente títulos aprovados podem ser pagos',
      );
    }

    if (title.status === 'PAID' || title.status === 'CANCELLED') {
      throw new BadRequestException(
        `Título com status ${title.status} não pode receber pagamento`,
      );
    }

    const balance = Number(title.balance);
    if (dto.amount > balance + 0.01) {
      throw new BadRequestException(
        `Valor do pagamento (${dto.amount}) excede o saldo (${balance})`,
      );
    }

    const newPaidAmount = Number(title.paidAmount) + dto.amount;
    const newBalance = Number(title.netAmount) - newPaidAmount;

    // Determine new status
    let newStatus: string;
    if (Math.abs(newBalance) < 0.01) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL';
    } else {
      newStatus = title.status;
    }

    return this.prisma.payableTitle.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        balance: Math.max(newBalance, 0),
        status: newStatus,
        paymentMethod: dto.paymentMethod,
        updatedBy: userId,
      },
      include: {
        costAllocations: true,
        taxes: true,
        approvals: { orderBy: { step: 'asc' } },
      },
    });
  }

  async markOverdue(companyId: string) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = await this.prisma.payableTitle.updateMany({
      where: {
        companyId,
        status: { in: ['OPEN', 'PARTIAL'] },
        dueDate: { lt: now },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    return { updated: result.count };
  }
}
