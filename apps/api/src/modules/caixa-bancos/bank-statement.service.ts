import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImportStatementDto, ReconcileDto } from './dto/bank-statement.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BankStatementService {
  constructor(private readonly prisma: PrismaService) {}

  async importStatement(companyId: string, dto: ImportStatementDto, createdBy: string) {
    // Validate account exists and belongs to company
    const account = await this.prisma.cashAccount.findFirst({
      where: { id: dto.cashAccountId, companyId },
    });

    if (!account) {
      throw new NotFoundException('Conta caixa/banco nao encontrada');
    }

    // Parse lines from raw content (CNAB 240) or use provided lines
    let parsedLines = dto.lines || [];

    if (dto.format === 'CNAB240' && dto.rawContent) {
      parsedLines = this.parseCnab240(dto.rawContent);
    }

    if (parsedLines.length === 0) {
      throw new BadRequestException('Nenhuma linha de extrato encontrada para importar');
    }

    // Create statement with lines in a transaction
    return this.prisma.$transaction(async (tx) => {
      const statement = await tx.bankStatement.create({
        data: {
          companyId,
          cashAccountId: dto.cashAccountId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          openingBalance: new Decimal(dto.openingBalance),
          closingBalance: new Decimal(dto.closingBalance),
          fileName: dto.fileName || null,
          format: dto.format,
          status: 'IMPORTED',
          createdBy,
          lines: {
            create: parsedLines.map((line) => ({
              date: new Date(line.date),
              amount: new Decimal(line.amount),
              type: line.type,
              description: line.description,
              documentNumber: line.documentNumber || null,
            })),
          },
        },
        include: { lines: true },
      });

      return statement;
    });
  }

  /**
   * Parse CNAB 240 format - extracts header and detail records.
   * CNAB 240 structure:
   * - Record type at position 7-7 (0-indexed: 7):
   *   0 = File header, 1 = Batch header, 3 = Detail, 5 = Batch trailer, 9 = File trailer
   * - Segment type at position 13-13 for details
   */
  private parseCnab240(rawContent: string): Array<{
    date: string;
    amount: number;
    type: string;
    description: string;
    documentNumber?: string;
  }> {
    const lines: Array<{
      date: string;
      amount: number;
      type: string;
      description: string;
      documentNumber?: string;
    }> = [];

    const records = rawContent.split('\n').filter((line) => line.length >= 240);

    for (const record of records) {
      const recordType = record.charAt(7);

      // Only process detail records (type 3) with segment E (extrato)
      if (recordType === '3') {
        const segmentType = record.charAt(13);

        // Segment E = statement detail line
        if (segmentType === 'E' || segmentType === 'e') {
          try {
            // Date at positions 142-149 (DDMMYYYY)
            const dateStr = record.substring(142, 150).trim();
            const day = dateStr.substring(0, 2);
            const month = dateStr.substring(2, 4);
            const year = dateStr.substring(4, 8);
            const date = `${year}-${month}-${day}`;

            // Amount at positions 152-169 (18 digits, last 2 are decimals)
            const amountStr = record.substring(152, 170).trim();
            const amount = parseInt(amountStr, 10) / 100;

            // Type: C = Credit, D = Debit at position 151
            const typeChar = record.charAt(151).toUpperCase();
            const type = typeChar === 'C' ? 'CREDIT' : 'DEBIT';

            // Description at positions 178-217
            const description = record.substring(178, 218).trim();

            // Document number at positions 170-177
            const documentNumber = record.substring(170, 178).trim() || undefined;

            if (amount > 0 && dateStr.length === 8) {
              lines.push({ date, amount, type, description, documentNumber });
            }
          } catch {
            // Skip malformed lines
            continue;
          }
        }
      }
    }

    return lines;
  }

  async findAll(companyId: string, filters?: { cashAccountId?: string; status?: string }) {
    const where: Record<string, unknown> = { companyId };
    if (filters?.cashAccountId) where.cashAccountId = filters.cashAccountId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.bankStatement.findMany({
      where,
      include: {
        lines: {
          select: { id: true, date: true, amount: true, type: true, reconciled: true },
        },
      },
      orderBy: { importDate: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id, companyId },
      include: { lines: true },
    });

    if (!statement) {
      throw new NotFoundException('Extrato bancario nao encontrado');
    }

    return statement;
  }

  async getLines(companyId: string, statementId: string) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, companyId },
    });

    if (!statement) {
      throw new NotFoundException('Extrato bancario nao encontrado');
    }

    return this.prisma.bankStatementLine.findMany({
      where: { statementId },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Auto-reconcile: match statement lines with movements by amount + date.
   */
  async autoReconcile(companyId: string, statementId: string) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, companyId },
      include: { lines: { where: { reconciled: false } } },
    });

    if (!statement) {
      throw new NotFoundException('Extrato bancario nao encontrado');
    }

    let matchedCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const line of statement.lines) {
        // Find unreconciled movement with same amount, type, and date
        const movement = await tx.cashMovement.findFirst({
          where: {
            companyId,
            cashAccountId: statement.cashAccountId,
            date: line.date,
            amount: line.amount,
            type: line.type,
            reconciled: false,
          },
        });

        if (movement) {
          // Mark statement line as reconciled
          await tx.bankStatementLine.update({
            where: { id: line.id },
            data: {
              reconciled: true,
              matchedMovementId: movement.id,
            },
          });

          // Mark movement as reconciled
          await tx.cashMovement.update({
            where: { id: movement.id },
            data: {
              reconciled: true,
              reconciledAt: new Date(),
            },
          });

          matchedCount++;
        }
      }

      // Update statement status
      const totalLines = await tx.bankStatementLine.count({
        where: { statementId },
      });
      const reconciledLines = await tx.bankStatementLine.count({
        where: { statementId, reconciled: true },
      });

      const newStatus =
        reconciledLines === totalLines
          ? 'RECONCILED'
          : reconciledLines > 0
            ? 'RECONCILING'
            : 'IMPORTED';

      await tx.bankStatement.update({
        where: { id: statementId },
        data: { status: newStatus },
      });
    });

    return { matchedCount };
  }

  /**
   * Manual reconcile: link a specific statement line to a specific movement.
   */
  async manualReconcile(companyId: string, statementId: string, dto: ReconcileDto) {
    const statement = await this.prisma.bankStatement.findFirst({
      where: { id: statementId, companyId },
    });

    if (!statement) {
      throw new NotFoundException('Extrato bancario nao encontrado');
    }

    const line = await this.prisma.bankStatementLine.findFirst({
      where: { id: dto.statementLineId, statementId },
    });

    if (!line) {
      throw new NotFoundException('Linha do extrato nao encontrada');
    }

    if (line.reconciled) {
      throw new BadRequestException('Linha do extrato ja esta conciliada');
    }

    const movement = await this.prisma.cashMovement.findFirst({
      where: { id: dto.movementId, companyId },
    });

    if (!movement) {
      throw new NotFoundException('Movimentacao nao encontrada');
    }

    if (movement.reconciled) {
      throw new BadRequestException('Movimentacao ja esta conciliada');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.bankStatementLine.update({
        where: { id: dto.statementLineId },
        data: {
          reconciled: true,
          matchedMovementId: dto.movementId,
        },
      });

      await tx.cashMovement.update({
        where: { id: dto.movementId },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
        },
      });

      // Update statement status
      const totalLines = await tx.bankStatementLine.count({
        where: { statementId },
      });
      const reconciledLines = await tx.bankStatementLine.count({
        where: { statementId, reconciled: true },
      });

      const newStatus =
        reconciledLines === totalLines
          ? 'RECONCILED'
          : 'RECONCILING';

      await tx.bankStatement.update({
        where: { id: statementId },
        data: { status: newStatus },
      });

      return { matched: true };
    });
  }
}
