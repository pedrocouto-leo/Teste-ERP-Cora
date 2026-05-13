import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { ApproveSettlementDto } from './dto/approve-settlement.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateSettlementNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `LIQ-${year}-`;

    const lastSettlement = await this.prisma.settlement.findFirst({
      where: {
        companyId,
        settlementNumber: { startsWith: prefix },
      },
      orderBy: { settlementNumber: 'desc' },
    });

    let sequence = 1;
    if (lastSettlement) {
      const lastNumber = lastSettlement.settlementNumber.replace(prefix, '');
      sequence = parseInt(lastNumber, 10) + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  async create(companyId: string, dto: CreateSettlementDto, createdBy: string) {
    if (dto.amount <= 0) {
      throw new BadRequestException('O valor da liquidação deve ser maior que zero');
    }

    const validTypes = ['PAYMENT', 'RECEIPT', 'TRANSFER'];
    if (!validTypes.includes(dto.type)) {
      throw new BadRequestException(
        `Tipo inválido. Valores permitidos: ${validTypes.join(', ')}`,
      );
    }

    const validModules = ['contas-pagar', 'contas-receber', 'caixa-bancos'];
    if (!validModules.includes(dto.sourceModule)) {
      throw new BadRequestException(
        `Módulo de origem inválido. Valores permitidos: ${validModules.join(', ')}`,
      );
    }

    const settlementNumber = await this.generateSettlementNumber(companyId);

    return this.prisma.settlement.create({
      data: {
        companyId,
        settlementNumber,
        type: dto.type,
        sourceModule: dto.sourceModule,
        sourceId: dto.sourceId,
        amount: dto.amount,
        date: new Date(dto.date),
        description: dto.description,
        bankAccountId: dto.bankAccountId,
        status: 'PENDING',
        createdBy,
      },
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    filters: {
      status?: string;
      type?: string;
      sourceModule?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.sourceModule) where.sourceModule = filters.sourceModule;

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.date = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { approvals: { orderBy: { step: 'asc' } } },
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const settlement = await this.prisma.settlement.findFirst({
      where: { id, companyId },
      include: { approvals: { orderBy: { step: 'asc' } } },
    });

    if (!settlement) {
      throw new NotFoundException('Liquidação não encontrada');
    }

    return settlement;
  }

  async approve(
    companyId: string,
    id: string,
    dto: ApproveSettlementDto,
    userId: string,
  ) {
    const settlement = await this.findOne(companyId, id);

    if (settlement.status !== 'PENDING' && settlement.status !== 'APPROVED') {
      throw new BadRequestException(
        `Liquidação com status ${settlement.status} não pode ser aprovada/rejeitada`,
      );
    }

    // Maker/Checker: creator cannot approve
    if (settlement.createdBy === userId) {
      throw new ForbiddenException(
        'Maker/Checker: o usuário que criou a liquidação não pode aprová-la',
      );
    }

    // Check user hasn't already approved this settlement
    const existingApproval = await this.prisma.settlementApproval.findFirst({
      where: { settlementId: id, userId },
    });

    if (existingApproval) {
      throw new BadRequestException(
        'Usuário já registrou aprovação para esta liquidação',
      );
    }

    // Determine current approval step
    const lastApproval = await this.prisma.settlementApproval.findFirst({
      where: { settlementId: id },
      orderBy: { step: 'desc' },
    });

    const currentStep = (lastApproval?.step ?? 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      // Create approval record
      await tx.settlementApproval.create({
        data: {
          settlementId: id,
          step: currentStep,
          userId,
          action: dto.action === 'approve' ? 'APPROVED' : 'REJECTED',
          comments: dto.comments,
        },
      });

      // Determine new status
      let newStatus: string;
      if (dto.action === 'reject') {
        newStatus = 'CANCELLED';
      } else {
        // Values > 500,000 need 2 approvals
        const requiredApprovals = new Decimal(settlement.amount).gt(500000) ? 2 : 1;
        newStatus = currentStep >= requiredApprovals ? 'APPROVED' : 'PENDING';
      }

      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'APPROVED') {
        updateData.approvedBy = userId;
        updateData.approvedAt = new Date();
      }

      return tx.settlement.update({
        where: { id },
        data: updateData,
        include: { approvals: { orderBy: { step: 'asc' } } },
      });
    });
  }

  async settle(companyId: string, id: string, _userId: string) {
    const settlement = await this.findOne(companyId, id);

    if (settlement.status !== 'APPROVED') {
      throw new BadRequestException(
        'Somente liquidações aprovadas podem ser efetivadas',
      );
    }

    return this.prisma.settlement.update({
      where: { id },
      data: {
        status: 'SETTLED',
        settledAt: new Date(),
      },
      include: { approvals: { orderBy: { step: 'asc' } } },
    });
  }

  async cancel(companyId: string, id: string, _userId: string) {
    const settlement = await this.findOne(companyId, id);

    if (settlement.status !== 'PENDING') {
      throw new BadRequestException(
        `Somente liquidações com status PENDING podem ser canceladas. Status atual: ${settlement.status}`,
      );
    }

    return this.prisma.settlement.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { approvals: { orderBy: { step: 'asc' } } },
    });
  }

  async getDashboard(companyId: string) {
    // Summary of pending settlements grouped by type and sourceModule
    const byType = await this.prisma.settlement.groupBy({
      by: ['type'],
      where: { companyId, status: 'PENDING' },
      _count: { id: true },
      _sum: { amount: true },
    });

    const byModule = await this.prisma.settlement.groupBy({
      by: ['sourceModule'],
      where: { companyId, status: 'PENDING' },
      _count: { id: true },
      _sum: { amount: true },
    });

    const byStatus = await this.prisma.settlement.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { id: true },
      _sum: { amount: true },
    });

    return {
      pendingByType: byType.map((item) => ({
        type: item.type,
        count: item._count.id,
        totalAmount: item._sum.amount,
      })),
      pendingByModule: byModule.map((item) => ({
        sourceModule: item.sourceModule,
        count: item._count.id,
        totalAmount: item._sum.amount,
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
        totalAmount: item._sum.amount,
      })),
    };
  }
}
