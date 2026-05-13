import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DdrCalculationService {
  private readonly logger = new Logger(DdrCalculationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateDerivedAccounts(reportId: string) {
    const entries = await this.prisma.ddrEntry.findMany({
      where: { reportId },
    });
    const params = await this.prisma.ddrParameter.findMany({
      where: { reportId },
    });

    const entryMap = new Map<string, number>();
    for (const entry of entries) {
      const key = this.entryKey(entry.accountCode, entry.currencyCode, entry.countryCode, entry.positionType);
      entryMap.set(key, Number(entry.value));
    }

    const paramMap = new Map<string, number>();
    for (const param of params) {
      paramMap.set(param.parameterCode, Number(param.value));
    }

    const calculated: Array<{ accountCode: string; value: number }> = [];

    // --- Net Position Accounts (per currency/position) ---
    const fxKeys = this.getUniqueCurrencyPositionKeys(entries, ['111000', '121000', '131000', '132000']);

    for (const { currencyCode, positionType } of fxKeys) {
      const get = (code: string) => {
        const key = this.entryKey(code, currencyCode, null, positionType);
        return entryMap.get(key) ?? 0;
      };

      const netBought = get('111000') - get('121000') + get('131000') - get('132000');
      const netSold = get('121000') - get('111000') + get('132000') - get('131000');

      // 141000 - Net Long
      await this.upsertCalculated(reportId, '141000', currencyCode, null, positionType, Math.max(0, netBought));
      // 151000 - Net Short
      await this.upsertCalculated(reportId, '151000', currencyCode, null, positionType, Math.max(0, netSold));
    }

    // --- RWACAM Calculations (single values, no elements) ---

    // 310100 = 310101 + 310102 + 310103 + 310104
    const v310100 = this.sumScalar(entryMap, ['310101', '310102', '310103', '310104']);
    await this.upsertCalculated(reportId, '310100', null, null, null, v310100);
    calculated.push({ accountCode: '310100', value: v310100 });

    // 310105 = Fator F'' = min(0.22 + 8.5*(EXP/PR)^2, 1) * 100
    const expValue = paramMap.get('EXP_VALUE') ?? 0;
    const prValue = paramMap.get('PR_VALUE') ?? 1;
    const ratio = prValue !== 0 ? expValue / prValue : 0;
    const factorF = Math.min(0.22 + 8.5 * ratio * ratio, 1) * 100;
    const truncatedF = Math.floor(factorF * 100) / 100;
    await this.upsertCalculated(reportId, '310105', null, null, null, truncatedF);
    calculated.push({ accountCode: '310105', value: truncatedF });

    // 310000 = 310100 * (310105 / 100)
    const v310000 = v310100 * (truncatedF / 100);
    await this.upsertCalculated(reportId, '310000', null, null, null, v310000);
    calculated.push({ accountCode: '310000', value: v310000 });

    // --- Market Risk Calculations ---

    // RWAJUR1
    const v410200 = this.sumScalar(entryMap, ['410201', '410202']);
    await this.upsertCalculated(reportId, '410200', null, null, null, v410200);

    const v410300 = this.sumScalar(entryMap, ['410301', '410302']);
    await this.upsertCalculated(reportId, '410300', null, null, null, v410300);

    const v410201 = this.getScalar(entryMap, '410201');
    const v410202 = this.getScalar(entryMap, '410202');
    const v410101 = this.getScalar(entryMap, '410101');
    const v410301 = this.getScalar(entryMap, '410301');
    const v410302 = this.getScalar(entryMap, '410302');

    const v410401 = Math.max(v410201, (v410101 * v410301) / 100);
    await this.upsertCalculated(reportId, '410401', null, null, null, v410401);

    const v410402 = Math.max(v410202, v410302);
    await this.upsertCalculated(reportId, '410402', null, null, null, v410402);

    const v410400 = v410401 + v410402;
    await this.upsertCalculated(reportId, '410400', null, null, null, v410400);
    calculated.push({ accountCode: '410400', value: v410400 });

    // RWAJUR2
    const v410500 = this.sumScalar(entryMap, ['410501', '410502', '410503', '410504']);
    await this.upsertCalculated(reportId, '410500', null, null, null, v410500);
    calculated.push({ accountCode: '410500', value: v410500 });

    // RWAJUR3
    const v410600 = this.sumScalar(entryMap, ['410601', '410602', '410603', '410604']);
    await this.upsertCalculated(reportId, '410600', null, null, null, v410600);
    calculated.push({ accountCode: '410600', value: v410600 });

    // RWAJUR4
    const v410700 = this.sumScalar(entryMap, ['410701', '410702', '410703', '410704']);
    await this.upsertCalculated(reportId, '410700', null, null, null, v410700);
    calculated.push({ accountCode: '410700', value: v410700 });

    // RWACOM
    const v410800 = this.sumScalar(entryMap, ['410801', '410802']);
    await this.upsertCalculated(reportId, '410800', null, null, null, v410800);
    calculated.push({ accountCode: '410800', value: v410800 });

    // RWAACS
    const v410900 = this.sumScalar(entryMap, ['410901', '410904', '410907', '410908', '410909', '410910']);
    await this.upsertCalculated(reportId, '410900', null, null, null, v410900);
    calculated.push({ accountCode: '410900', value: v410900 });

    // RWAMPAD
    const v503000 = v310000 + v410400 + v410500 + v410600 + v410700 + v410800 + v410900;
    await this.upsertCalculated(reportId, '503000', null, null, null, v503000);
    calculated.push({ accountCode: '503000', value: v503000 });

    this.logger.log(`Calculated ${calculated.length} derived accounts for report ${reportId}`);

    return { calculated };
  }

  private async upsertCalculated(
    reportId: string,
    accountCode: string,
    currencyCode: string | null,
    countryCode: string | null,
    positionType: number | null,
    value: number,
  ) {
    const roundedValue = Math.round(value * 100) / 100;
    return this.prisma.ddrEntry.upsert({
      where: {
        reportId_accountCode_currencyCode_countryCode_positionType: {
          reportId,
          accountCode,
          currencyCode: currencyCode ?? '',
          countryCode: countryCode ?? '',
          positionType: positionType ?? 0,
        },
      },
      create: {
        reportId,
        accountCode,
        currencyCode,
        countryCode,
        positionType,
        value: roundedValue,
        isCalculated: true,
      },
      update: {
        value: roundedValue,
        isCalculated: true,
      },
    });
  }

  private entryKey(
    accountCode: string,
    currencyCode: string | null,
    countryCode: string | null,
    positionType: number | null,
  ): string {
    return `${accountCode}|${currencyCode ?? ''}|${countryCode ?? ''}|${positionType ?? ''}`;
  }

  private getScalar(entryMap: Map<string, number>, accountCode: string): number {
    return entryMap.get(this.entryKey(accountCode, null, null, null)) ?? 0;
  }

  private sumScalar(entryMap: Map<string, number>, codes: string[]): number {
    return codes.reduce((sum, code) => sum + this.getScalar(entryMap, code), 0);
  }

  private getUniqueCurrencyPositionKeys(
    entries: Array<{ accountCode: string; currencyCode: string | null; positionType: number | null }>,
    accountCodes: string[],
  ): Array<{ currencyCode: string | null; positionType: number | null }> {
    const seen = new Set<string>();
    const result: Array<{ currencyCode: string | null; positionType: number | null }> = [];

    for (const entry of entries) {
      if (!accountCodes.includes(entry.accountCode)) continue;
      const key = `${entry.currencyCode}|${entry.positionType}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          currencyCode: entry.currencyCode,
          positionType: entry.positionType,
        });
      }
    }

    return result;
  }
}
