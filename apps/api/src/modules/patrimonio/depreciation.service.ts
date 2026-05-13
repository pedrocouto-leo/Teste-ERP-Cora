import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DepreciationResult {
  assetId: string;
  assetNumber: string;
  description: string;
  amount: number;
  accumulated: number;
  bookValue: number;
}

@Injectable()
export class DepreciationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates linear depreciation for a single asset.
   * Formula: (acquisitionValue - residualValue) / usefulLifeMonths
   */
  private calculateMonthlyDeprec(
    acquisitionValue: number,
    residualValue: number,
    usefulLifeMonths: number,
    currentAccumulated: number,
  ): number {
    const depreciableBase = acquisitionValue - residualValue;
    const monthlyAmount = depreciableBase / usefulLifeMonths;

    // Don't depreciate beyond the depreciable base
    const remainingDeprec = depreciableBase - currentAccumulated;
    if (remainingDeprec <= 0) return 0;

    return Math.min(monthlyAmount, remainingDeprec);
  }

  /**
   * Simulate depreciation for a given period without persisting.
   */
  async simulate(companyId: string, year: number, month: number): Promise<DepreciationResult[]> {
    const assets = await this.prisma.asset.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: { group: true },
    });

    const results: DepreciationResult[] = [];

    for (const asset of assets) {
      const acquisitionValue = Number(asset.acquisitionValue);
      const residualValue = Number(asset.residualValue);
      const currentAccumulated = Number(asset.accumulatedDeprec);
      const usefulLifeMonths = asset.group.usefulLife;

      const amount = this.calculateMonthlyDeprec(
        acquisitionValue,
        residualValue,
        usefulLifeMonths,
        currentAccumulated,
      );

      if (amount > 0) {
        const newAccumulated = currentAccumulated + amount;
        const bookValue = acquisitionValue - newAccumulated;

        results.push({
          assetId: asset.id,
          assetNumber: asset.assetNumber,
          description: asset.description,
          amount: Math.round(amount * 10000) / 10000,
          accumulated: Math.round(newAccumulated * 10000) / 10000,
          bookValue: Math.round(bookValue * 10000) / 10000,
        });
      }
    }

    return results;
  }

  /**
   * Run monthly depreciation for all active assets and persist results.
   */
  async run(companyId: string, year: number, month: number): Promise<DepreciationResult[]> {
    // Check if depreciation was already run for this period
    const existingCount = await this.prisma.assetDepreciation.count({
      where: {
        periodYear: year,
        periodMonth: month,
        asset: { companyId },
      },
    });

    if (existingCount > 0) {
      throw new ConflictException(
        `Depreciação já foi executada para o período ${month.toString().padStart(2, '0')}/${year}`,
      );
    }

    const simulationResults = await this.simulate(companyId, year, month);

    if (simulationResults.length === 0) {
      return [];
    }

    return this.prisma.$transaction(async (tx) => {
      for (const result of simulationResults) {
        // Create depreciation record
        await tx.assetDepreciation.create({
          data: {
            assetId: result.assetId,
            periodYear: year,
            periodMonth: month,
            amount: result.amount,
            accumulated: result.accumulated,
            bookValue: result.bookValue,
          },
        });

        // Update asset values
        await tx.asset.update({
          where: { id: result.assetId },
          data: {
            accumulatedDeprec: result.accumulated,
            currentValue: result.bookValue,
          },
        });
      }

      return simulationResults;
    });
  }

  /**
   * Close depreciation period (idempotent check - ensures run was executed).
   */
  async close(companyId: string, year: number, month: number) {
    const count = await this.prisma.assetDepreciation.count({
      where: {
        periodYear: year,
        periodMonth: month,
        asset: { companyId },
      },
    });

    if (count === 0) {
      throw new BadRequestException(
        `Depreciação não foi executada para o período ${month.toString().padStart(2, '0')}/${year}. Execute primeiro.`,
      );
    }

    return {
      period: `${month.toString().padStart(2, '0')}/${year}`,
      assetsDepreciated: count,
      status: 'CLOSED',
    };
  }
}
