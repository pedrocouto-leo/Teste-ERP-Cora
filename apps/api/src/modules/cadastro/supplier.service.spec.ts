import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SupplierService', () => {
  let service: SupplierService;
  let prisma: {
    supplier: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      supplier: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<SupplierService>(SupplierService);
  });

  // Job story principal: cadastrar fornecedor com validação CPF/CNPJ + maker/checker
  it('rejects invalid CNPJ', async () => {
    await expect(
      service.create(
        'c-1',
        { name: 'F1', cpfCnpj: '00000000000000', personType: 'PJ' } as any,
        'u-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a valid supplier as PENDING (maker/checker)', async () => {
    prisma.supplier.findFirst.mockResolvedValue(null);
    prisma.supplier.create.mockResolvedValue({ id: 's-1' });

    // Valid CNPJ: 11.222.333/0001-81
    await service.create(
      'c-1',
      { name: 'F1', cpfCnpj: '11222333000181', personType: 'PJ' } as any,
      'u-1',
    );

    expect(prisma.supplier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'c-1',
          createdBy: 'u-1',
          status: 'PENDING',
        }),
      }),
    );
  });

  // Maker/Checker rule: creator cannot approve
  it('blocks self-approval (maker/checker)', async () => {
    prisma.supplier.findFirst.mockResolvedValue({
      id: 's-1',
      status: 'PENDING',
      createdBy: 'u-1',
    });

    await expect(
      service.approve('c-1', 's-1', { action: 'approve' } as any, 'u-1'),
    ).rejects.toThrow(/Maker\/Checker/);
  });

  it('approves when checker differs from maker', async () => {
    prisma.supplier.findFirst.mockResolvedValue({
      id: 's-1',
      status: 'PENDING',
      createdBy: 'u-1',
    });
    prisma.supplier.update.mockResolvedValue({ id: 's-1', status: 'APPROVED' });

    const result = await service.approve(
      'c-1',
      's-1',
      { action: 'approve' } as any,
      'u-2',
    );

    expect(result.status).toBe('APPROVED');
    expect(prisma.supplier.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED', approvedBy: 'u-2' }),
      }),
    );
  });

  it('rejects duplicate CPF/CNPJ within tenant', async () => {
    prisma.supplier.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(
      service.create(
        'c-1',
        { name: 'F1', cpfCnpj: '11222333000181', personType: 'PJ' } as any,
        'u-1',
      ),
    ).rejects.toThrow(ConflictException);
  });
});
