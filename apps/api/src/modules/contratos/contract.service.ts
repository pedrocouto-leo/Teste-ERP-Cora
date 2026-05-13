import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateAddendumDto } from './dto/contract-addendum.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateContractDto, createdBy: string) {
    // Validate supplier exists and belongs to company
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, companyId, active: true },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado ou inativo');
    }

    // Build installments data
    let installmentsData: { number: number; dueDate: Date; amount: number }[] = [];

    if (dto.installments && dto.installments.length > 0) {
      // Use manually provided installments
      installmentsData = dto.installments.map((inst, idx) => ({
        number: idx + 1,
        dueDate: new Date(inst.dueDate),
        amount: inst.amount,
      }));
    } else if (dto.type === 'FIXED' || dto.type === 'INSTALLMENT') {
      // Auto-generate monthly installments based on contract duration
      if (!dto.endDate) {
        throw new BadRequestException(
          'Data de término é obrigatória para contratos do tipo FIXED ou INSTALLMENT',
        );
      }

      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      // Inclusive month count: a contract running 2026-01-01 → 2026-12-31
      // covers 12 months and therefore generates 12 monthly installments.
      const months = this.monthsBetween(start, end) + 1;

      if (months <= 0) {
        throw new BadRequestException(
          'A data de término deve ser posterior à data de início',
        );
      }

      const monthlyAmount = Number((dto.totalValue / months).toFixed(4));
      let remainder = dto.totalValue;

      for (let i = 0; i < months; i++) {
        const dueDate = new Date(start);
        // First installment due on the contract start date; subsequent ones
        // shift forward by one month each. UTC-safe.
        dueDate.setUTCMonth(dueDate.getUTCMonth() + i);

        const isLast = i === months - 1;
        const amount = isLast ? Number(remainder.toFixed(4)) : monthlyAmount;
        remainder -= monthlyAmount;

        installmentsData.push({
          number: i + 1,
          dueDate,
          amount,
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          companyId,
          contractNumber: dto.contractNumber,
          supplierId: dto.supplierId,
          type: dto.type,
          description: dto.description,
          totalValue: dto.totalValue,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          autoRenew: dto.autoRenew ?? false,
          renewalMonths: dto.renewalMonths,
          indexerId: dto.indexerId,
          costCenterId: dto.costCenterId,
          projectId: dto.projectId,
          status: 'DRAFT',
          approvalStatus: 'PENDING',
          createdBy,
          installments:
            installmentsData.length > 0
              ? {
                  createMany: {
                    data: installmentsData,
                  },
                }
              : undefined,
        },
        include: {
          installments: { orderBy: { number: 'asc' } },
        },
      });

      return contract;
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    filters: {
      status?: string;
      type?: string;
      supplierId?: string;
      startDateFrom?: string;
      startDateTo?: string;
    },
  ) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId, active: true };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.supplierId) where.supplierId = filters.supplierId;

    if (filters.startDateFrom || filters.startDateTo) {
      const startDateFilter: Record<string, Date> = {};
      if (filters.startDateFrom) startDateFilter.gte = new Date(filters.startDateFrom);
      if (filters.startDateTo) startDateFilter.lte = new Date(filters.startDateTo);
      where.startDate = startDateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, companyId },
      include: {
        installments: { orderBy: { number: 'asc' } },
        addendums: { orderBy: { number: 'asc' } },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrato não encontrado');
    }

    return contract;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateContractDto,
    updatedBy: string,
  ) {
    const contract = await this.findOne(companyId, id);

    if (contract.status !== 'DRAFT') {
      throw new BadRequestException(
        'Somente contratos em rascunho (DRAFT) podem ser alterados',
      );
    }

    const updateData: Record<string, unknown> = { updatedBy };

    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.totalValue !== undefined) updateData.totalValue = dto.totalValue;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.autoRenew !== undefined) updateData.autoRenew = dto.autoRenew;
    if (dto.renewalMonths !== undefined) updateData.renewalMonths = dto.renewalMonths;
    if (dto.indexerId !== undefined) updateData.indexerId = dto.indexerId;
    if (dto.costCenterId !== undefined) updateData.costCenterId = dto.costCenterId;
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;

    return this.prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        installments: { orderBy: { number: 'asc' } },
        addendums: { orderBy: { number: 'asc' } },
      },
    });
  }

  async approve(
    companyId: string,
    id: string,
    action: 'approve' | 'reject',
    userId: string,
  ) {
    const contract = await this.findOne(companyId, id);

    if (contract.approvalStatus === 'APPROVED') {
      throw new BadRequestException('Contrato já foi aprovado');
    }

    if (contract.approvalStatus === 'REJECTED' && action === 'approve') {
      throw new BadRequestException(
        'Contrato rejeitado não pode ser aprovado diretamente. Crie um novo.',
      );
    }

    // Maker/Checker: creator cannot approve
    if (contract.createdBy === userId) {
      throw new ForbiddenException(
        'Maker/Checker: o usuário que criou o contrato não pode aprová-lo',
      );
    }

    const updateData: Record<string, unknown> = {};

    if (action === 'approve') {
      updateData.approvalStatus = 'APPROVED';
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
      updateData.status = 'ACTIVE';
    } else {
      updateData.approvalStatus = 'REJECTED';
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    }

    return this.prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        installments: { orderBy: { number: 'asc' } },
        addendums: { orderBy: { number: 'asc' } },
      },
    });
  }

  async releaseInstallment(
    companyId: string,
    contractId: string,
    installmentId: string,
    userId: string,
  ) {
    const contract = await this.findOne(companyId, contractId);

    if (contract.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Somente contratos ativos podem ter parcelas liberadas',
      );
    }

    const installment = await this.prisma.contractInstallment.findFirst({
      where: { id: installmentId, contractId },
    });

    if (!installment) {
      throw new NotFoundException('Parcela não encontrada');
    }

    if (installment.status !== 'PENDING') {
      throw new BadRequestException(
        `Parcela com status ${installment.status} não pode ser liberada`,
      );
    }

    // In production, this would generate a payable title in Contas a Pagar
    return this.prisma.contractInstallment.update({
      where: { id: installmentId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        releasedBy: userId,
      },
    });
  }

  async addAddendum(
    companyId: string,
    contractId: string,
    dto: CreateAddendumDto,
    createdBy: string,
  ) {
    const contract = await this.findOne(companyId, contractId);

    if (contract.status !== 'ACTIVE' && contract.status !== 'SUSPENDED') {
      throw new BadRequestException(
        'Aditivos só podem ser adicionados a contratos ativos ou suspensos',
      );
    }

    // Determine next addendum number
    const lastAddendum = await this.prisma.contractAddendum.findFirst({
      where: { contractId },
      orderBy: { number: 'desc' },
    });

    const nextNumber = (lastAddendum?.number ?? 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      const addendum = await tx.contractAddendum.create({
        data: {
          contractId,
          number: nextNumber,
          description: dto.description,
          valueChange: dto.valueChange,
          newEndDate: dto.newEndDate ? new Date(dto.newEndDate) : null,
          createdBy,
        },
      });

      // Update contract value and/or end date if provided
      const contractUpdate: Record<string, unknown> = {};

      if (dto.valueChange !== undefined) {
        const currentValue = Number(contract.totalValue);
        contractUpdate.totalValue = currentValue + dto.valueChange;
      }

      if (dto.newEndDate) {
        contractUpdate.endDate = new Date(dto.newEndDate);
      }

      if (Object.keys(contractUpdate).length > 0) {
        await tx.contract.update({
          where: { id: contractId },
          data: contractUpdate,
        });
      }

      return addendum;
    });
  }

  async renew(companyId: string, id: string, createdBy: string) {
    const contract = await this.findOne(companyId, id);

    if (contract.status !== 'FINISHED' && contract.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Somente contratos ativos ou finalizados podem ser renovados',
      );
    }

    if (!contract.autoRenew && contract.status === 'ACTIVE') {
      throw new BadRequestException(
        'Contrato ativo sem renovação automática. Finalize-o antes de renovar manualmente.',
      );
    }

    const renewalMonths = contract.renewalMonths ?? 12;
    const oldEnd = contract.endDate ?? new Date();
    const newStart = new Date(oldEnd);
    newStart.setDate(newStart.getDate() + 1);
    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + renewalMonths);

    // Generate a new contract number
    const newNumber = `${contract.contractNumber}-R${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      // Mark original as FINISHED if still active
      if (contract.status === 'ACTIVE') {
        await tx.contract.update({
          where: { id },
          data: { status: 'FINISHED' },
        });
      }

      const newContract = await tx.contract.create({
        data: {
          companyId,
          contractNumber: newNumber.substring(0, 30),
          supplierId: contract.supplierId,
          type: contract.type,
          description: contract.description,
          totalValue: contract.totalValue,
          startDate: newStart,
          endDate: newEnd,
          autoRenew: contract.autoRenew,
          renewalMonths: contract.renewalMonths,
          indexerId: contract.indexerId,
          costCenterId: contract.costCenterId,
          projectId: contract.projectId,
          status: 'DRAFT',
          approvalStatus: 'PENDING',
          createdBy,
        },
        include: {
          installments: { orderBy: { number: 'asc' } },
        },
      });

      return newContract;
    });
  }

  async suspend(companyId: string, id: string, userId: string) {
    const contract = await this.findOne(companyId, id);

    if (contract.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Somente contratos ativos podem ser suspensos',
      );
    }

    return this.prisma.contract.update({
      where: { id },
      data: { status: 'SUSPENDED', updatedBy: userId },
      include: {
        installments: { orderBy: { number: 'asc' } },
        addendums: { orderBy: { number: 'asc' } },
      },
    });
  }

  async reactivate(companyId: string, id: string, userId: string) {
    const contract = await this.findOne(companyId, id);

    if (contract.status !== 'SUSPENDED') {
      throw new BadRequestException(
        'Somente contratos suspensos podem ser reativados',
      );
    }

    return this.prisma.contract.update({
      where: { id },
      data: { status: 'ACTIVE', updatedBy: userId },
      include: {
        installments: { orderBy: { number: 'asc' } },
        addendums: { orderBy: { number: 'asc' } },
      },
    });
  }

  async finish(companyId: string, id: string, userId: string) {
    const contract = await this.findOne(companyId, id);

    if (contract.status !== 'ACTIVE' && contract.status !== 'SUSPENDED') {
      throw new BadRequestException(
        'Somente contratos ativos ou suspensos podem ser finalizados',
      );
    }

    return this.prisma.contract.update({
      where: { id },
      data: { status: 'FINISHED', updatedBy: userId },
      include: {
        installments: { orderBy: { number: 'asc' } },
        addendums: { orderBy: { number: 'asc' } },
      },
    });
  }

  async cancel(companyId: string, id: string, userId: string) {
    const contract = await this.findOne(companyId, id);

    if (contract.status === 'CANCELLED' || contract.status === 'FINISHED') {
      throw new BadRequestException(
        `Contrato com status ${contract.status} não pode ser cancelado`,
      );
    }

    return this.prisma.contract.update({
      where: { id },
      data: { status: 'CANCELLED', active: false, updatedBy: userId },
      include: {
        installments: { orderBy: { number: 'asc' } },
        addendums: { orderBy: { number: 'asc' } },
      },
    });
  }

  private monthsBetween(start: Date, end: Date): number {
    // Use UTC to make the result timezone-deterministic: ISO date strings
    // ('2026-01-01') parse as UTC midnight, but getMonth()/getFullYear()
    // return *local* components which shift the year/month boundary in any
    // timezone west of UTC, breaking installment counts on CI vs dev.
    return (
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth())
    );
  }
}
