import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Faixas de provisão conforme Resolução 4.966/2021
 * Modelo simplificado para SCFI S4
 */
const PDD_RANGES = [
  { minDays: 0, maxDays: 14, level: 'A', rate: 0.005 },
  { minDays: 15, maxDays: 30, level: 'B', rate: 0.01 },
  { minDays: 31, maxDays: 60, level: 'C', rate: 0.03 },
  { minDays: 61, maxDays: 90, level: 'D', rate: 0.10 },
  { minDays: 91, maxDays: 120, level: 'E', rate: 0.30 },
  { minDays: 121, maxDays: 150, level: 'F', rate: 0.50 },
  { minDays: 151, maxDays: 180, level: 'G', rate: 0.70 },
  { minDays: 181, maxDays: Infinity, level: 'H', rate: 1.00 },
];

@Injectable()
export class PddService {
  private readonly logger = new Logger(PddService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * PDD - Provisão para Devedores Duvidosos
   * Conforme Resolução CMN 4.966/2021
   */
  async calculate(companyId: string, referenceDate: string) {
    const refDate = new Date(referenceDate);

    // Buscar todos os títulos em aberto
    const receivables = await this.prisma.receivableTitle.findMany({
      where: {
        companyId,
        status: { in: ['OPEN', 'PARTIAL', 'OVERDUE'] },
      },
    });

    const provisionByLevel: Record<string, { count: number; balance: number; provision: number }> = {};
    for (const range of PDD_RANGES) {
      provisionByLevel[range.level] = { count: 0, balance: 0, provision: 0 };
    }

    const details = receivables.map((r) => {
      const dueDate = new Date(r.dueDate);
      const daysOverdue = Math.max(
        0,
        Math.floor((refDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      );

      const range = PDD_RANGES.find(
        (rng) => daysOverdue >= rng.minDays && daysOverdue <= rng.maxDays,
      ) || PDD_RANGES[PDD_RANGES.length - 1];

      const balance = Number(r.balance);
      const provision = balance * range.rate;

      provisionByLevel[range.level].count += 1;
      provisionByLevel[range.level].balance += balance;
      provisionByLevel[range.level].provision += provision;

      return {
        receivableId: r.id,
        clientId: r.clientId,
        dueDate: r.dueDate,
        balance,
        daysOverdue,
        level: range.level,
        rate: range.rate,
        provision,
      };
    });

    const totalBalance = details.reduce((s, d) => s + d.balance, 0);
    const totalProvision = details.reduce((s, d) => s + d.provision, 0);

    return {
      referenceDate,
      model: 'SIMPLIFIED', // Modelo simplificado para S4
      resolution: 'CMN 4.966/2021',
      summary: {
        totalOperations: details.length,
        totalBalance,
        totalProvision,
        provisionRate: totalBalance > 0 ? (totalProvision / totalBalance) * 100 : 0,
      },
      byLevel: provisionByLevel,
      details,
      status: 'CALCULATED',
      calculatedAt: new Date(),
    };
  }

  /**
   * Simula provisão com cenários de stress
   */
  async simulate(companyId: string, referenceDate: string, stressFactor: number = 1.0) {
    const base = await this.calculate(companyId, referenceDate);

    const stressed = {
      ...base,
      model: 'STRESSED',
      stressFactor,
      summary: {
        ...base.summary,
        totalProvision: base.summary.totalProvision * stressFactor,
        provisionRate: base.summary.provisionRate * stressFactor,
      },
    };

    return stressed;
  }
}
