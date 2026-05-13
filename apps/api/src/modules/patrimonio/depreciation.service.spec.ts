import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { DepreciationService } from './depreciation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DepreciationService', () => {
  let service: DepreciationService;
  let prisma: any;
  let tx: any;

  beforeEach(async () => {
    tx = {
      assetDepreciation: { create: jest.fn() },
      asset: { update: jest.fn() },
    };
    prisma = {
      asset: { findMany: jest.fn(), update: jest.fn() },
      assetDepreciation: { count: jest.fn(), findMany: jest.fn(), create: jest.fn() },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<unknown>) => cb(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepreciationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<DepreciationService>(DepreciationService);
  });

  // Job story principal: depreciação linear = (valor - residual) / vida útil
  it('calculates monthly linear depreciation correctly', async () => {
    prisma.asset.findMany.mockResolvedValue([
      {
        id: 'a-1',
        assetNumber: 'BEM-001',
        description: 'Notebook',
        acquisitionValue: new Decimal(12000),
        residualValue: new Decimal(0),
        accumulatedDeprec: new Decimal(0),
        group: { usefulLife: 60 }, // 5 anos = 60 meses
      },
    ]);

    const results = await service.simulate('c-1', 2026, 5);

    expect(results).toEqual([
      {
        assetId: 'a-1',
        assetNumber: 'BEM-001',
        description: 'Notebook',
        amount: 200, // 12000 / 60
        accumulated: 200,
        bookValue: 11800,
      },
    ]);
  });

  // Regra: não depreciar além da base depreciável
  it('caps depreciation at remaining depreciable base', async () => {
    prisma.asset.findMany.mockResolvedValue([
      {
        id: 'a-1',
        assetNumber: 'BEM-002',
        description: 'Velho',
        acquisitionValue: new Decimal(1000),
        residualValue: new Decimal(0),
        accumulatedDeprec: new Decimal(990),
        group: { usefulLife: 60 },
      },
    ]);

    const results = await service.simulate('c-1', 2026, 5);

    // Remaining base = 10 (menor que o mensal de 16.67, então cap aplica)
    expect(results[0].amount).toBe(10);
    expect(results[0].bookValue).toBe(0);
  });

  // Não gera registro para ativo totalmente depreciado
  it('skips fully depreciated asset', async () => {
    prisma.asset.findMany.mockResolvedValue([
      {
        id: 'a-1',
        assetNumber: 'BEM-003',
        description: 'Esgotado',
        acquisitionValue: new Decimal(1000),
        residualValue: new Decimal(0),
        accumulatedDeprec: new Decimal(1000),
        group: { usefulLife: 60 },
      },
    ]);

    const results = await service.simulate('c-1', 2026, 5);
    expect(results).toEqual([]);
  });

  // Regra: rodar duas vezes no mesmo período é bloqueado
  it('blocks re-running depreciation for the same period', async () => {
    prisma.assetDepreciation.count.mockResolvedValue(3);

    await expect(service.run('c-1', 2026, 5)).rejects.toThrow(ConflictException);
  });
});
