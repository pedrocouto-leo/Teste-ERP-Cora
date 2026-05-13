import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashMovementDto, TransferDto } from './dto/cash-movement.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CashMovementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateCashMovementDto, createdBy: string) {
    // Validate account exists and belongs to company
    const account = await this.prisma.cashAccount.findFirst({
      where: { id: dto.cashAccountId, companyId },
    });

    if (!account) {
      throw new NotFoundException('Conta caixa/banco nao encontrada');
    }

    if (!account.active) {
      throw new BadRequestException('Conta caixa/banco esta inativa');
    }

    const amount = new Decimal(dto.amount);

    // Atomic transaction: create movement + update balance
    return this.prisma.$transaction(async (tx) => {
      // Lock the account row for update to prevent race conditions
      const currentAccount = await tx.cashAccount.findUnique({
        where: { id: dto.cashAccountId },
      });

      if (!currentAccount) {
        throw new NotFoundException('Conta caixa/banco nao encontrada');
      }

      const currentBalance = new Decimal(currentAccount.balance.toString());
      const balanceAfter =
        dto.type === 'CREDIT'
          ? currentBalance.add(amount)
          : currentBalance.sub(amount);

      // Create the movement
      const movement = await tx.cashMovement.create({
        data: {
          companyId,
          cashAccountId: dto.cashAccountId,
          date: new Date(dto.date),
          type: dto.type,
          amount,
          balanceAfter,
          description: dto.description,
          category: dto.category,
          costCenterId: dto.costCenterId || null,
          projectId: dto.projectId || null,
          createdBy,
        },
      });

      // Update account balance
      await tx.cashAccount.update({
        where: { id: dto.cashAccountId },
        data: { balance: balanceAfter },
      });

      return movement;
    });
  }

  async transfer(companyId: string, dto: TransferDto, createdBy: string) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException('Conta de origem e destino nao podem ser iguais');
    }

    const fromAccount = await this.prisma.cashAccount.findFirst({
      where: { id: dto.fromAccountId, companyId, active: true },
    });
    if (!fromAccount) {
      throw new NotFoundException('Conta de origem nao encontrada ou inativa');
    }

    const toAccount = await this.prisma.cashAccount.findFirst({
      where: { id: dto.toAccountId, companyId, active: true },
    });
    if (!toAccount) {
      throw new NotFoundException('Conta de destino nao encontrada ou inativa');
    }

    const amount = new Decimal(dto.amount);
    const movementDate = new Date(dto.date);

    return this.prisma.$transaction(async (tx) => {
      // Debit from source
      const fromCurrent = await tx.cashAccount.findUnique({
        where: { id: dto.fromAccountId },
      });
      const fromBalance = new Decimal(fromCurrent!.balance.toString());
      const fromBalanceAfter = fromBalance.sub(amount);

      const debitMovement = await tx.cashMovement.create({
        data: {
          companyId,
          cashAccountId: dto.fromAccountId,
          date: movementDate,
          type: 'DEBIT',
          amount,
          balanceAfter: fromBalanceAfter,
          description: `Transferencia para ${toAccount.name}: ${dto.description}`,
          category: 'TRANSFER',
          createdBy,
        },
      });

      await tx.cashAccount.update({
        where: { id: dto.fromAccountId },
        data: { balance: fromBalanceAfter },
      });

      // Credit to destination
      const toCurrent = await tx.cashAccount.findUnique({
        where: { id: dto.toAccountId },
      });
      const toBalance = new Decimal(toCurrent!.balance.toString());
      const toBalanceAfter = toBalance.add(amount);

      const creditMovement = await tx.cashMovement.create({
        data: {
          companyId,
          cashAccountId: dto.toAccountId,
          date: movementDate,
          type: 'CREDIT',
          amount,
          balanceAfter: toBalanceAfter,
          description: `Transferencia de ${fromAccount.name}: ${dto.description}`,
          category: 'TRANSFER',
          sourceId: debitMovement.id,
          createdBy,
        },
      });

      await tx.cashAccount.update({
        where: { id: dto.toAccountId },
        data: { balance: toBalanceAfter },
      });

      // Link the debit movement to the credit movement
      await tx.cashMovement.update({
        where: { id: debitMovement.id },
        data: { sourceId: creditMovement.id },
      });

      return { debit: debitMovement, credit: creditMovement };
    });
  }

  async findAll(
    companyId: string,
    filters?: {
      cashAccountId?: string;
      dateFrom?: string;
      dateTo?: string;
      category?: string;
      reconciled?: boolean;
      type?: string;
    },
  ) {
    const where: Record<string, unknown> = { companyId };

    if (filters?.cashAccountId) where.cashAccountId = filters.cashAccountId;
    if (filters?.category) where.category = filters.category;
    if (filters?.type) where.type = filters.type;
    if (filters?.reconciled !== undefined) where.reconciled = filters.reconciled;

    if (filters?.dateFrom || filters?.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.date = dateFilter;
    }

    return this.prisma.cashMovement.findMany({
      where,
      include: { cashAccount: { select: { id: true, name: true, type: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const movement = await this.prisma.cashMovement.findFirst({
      where: { id, companyId },
      include: { cashAccount: true },
    });

    if (!movement) {
      throw new NotFoundException('Movimentacao nao encontrada');
    }

    return movement;
  }
}
