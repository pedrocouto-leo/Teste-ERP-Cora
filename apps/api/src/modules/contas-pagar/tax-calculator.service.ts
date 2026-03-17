import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface TaxCalculationResult {
  taxType: string;
  baseAmount: Decimal;
  rate: Decimal;
  amount: Decimal;
  withheld: boolean;
}

@Injectable()
export class TaxCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate tax withholdings based on configured TaxParameter rates.
   * Respects minimum amount thresholds and validity periods.
   */
  async calculateTaxes(
    companyId: string,
    baseAmount: number,
    taxTypes: string[],
    referenceDate: Date = new Date(),
  ): Promise<TaxCalculationResult[]> {
    const results: TaxCalculationResult[] = [];

    for (const taxType of taxTypes) {
      const param = await this.prisma.taxParameter.findFirst({
        where: {
          companyId,
          taxType,
          validFrom: { lte: referenceDate },
          OR: [
            { validTo: null },
            { validTo: { gte: referenceDate } },
          ],
        },
        orderBy: { validFrom: 'desc' },
      });

      if (!param) continue;

      // Check minimum amount threshold
      if (param.minAmount && new Decimal(baseAmount).lt(param.minAmount)) {
        continue;
      }

      const rate = param.rate;
      const amount = new Decimal(baseAmount)
        .mul(rate)
        .div(100)
        .toDecimalPlaces(4);

      results.push({
        taxType,
        baseAmount: new Decimal(baseAmount),
        rate,
        amount,
        withheld: true,
      });
    }

    return results;
  }

  /**
   * Calculate net amount after deducting withheld taxes.
   */
  calculateNetAmount(
    originalAmount: number,
    taxes: { amount: number; withheld?: boolean }[],
  ): number {
    const withheldTotal = taxes
      .filter((t) => t.withheld !== false)
      .reduce((sum, t) => sum + t.amount, 0);

    return originalAmount - withheldTotal;
  }
}
