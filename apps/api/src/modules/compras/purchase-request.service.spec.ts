import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PurchaseRequestService } from './purchase-request.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      purchaseRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<PurchaseRequestService>(PurchaseRequestService);
  });

  // Job story principal: abrir solicitação de compra com total estimado calculado
  it('creates a purchase request with computed total', async () => {
    prisma.purchaseRequest.create.mockResolvedValue({ id: 'pr-1' });

    await service.create(
      'c-1',
      {
        description: 'Notebooks para área financeira',
        items: [
          { description: 'Notebook', quantity: 5, estimatedUnitPrice: 8000 },
          { description: 'Mouse', quantity: 5, estimatedUnitPrice: 200 },
        ],
      } as any,
      'u-1',
    );

    expect(prisma.purchaseRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'c-1',
          totalEstimated: 41000,
          status: 'PENDING',
          createdBy: 'u-1',
        }),
      }),
    );
  });

  // Maker/Checker
  it('blocks self-approval', async () => {
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'pr-1',
      status: 'PENDING',
      createdBy: 'u-1',
      items: [],
      quotations: [],
    });

    await expect(
      service.approve('c-1', 'pr-1', { action: 'approve' } as any, 'u-1'),
    ).rejects.toThrow(/Maker\/Checker/);
  });

  it('approves a pending request', async () => {
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'pr-1',
      status: 'PENDING',
      createdBy: 'u-maker',
      items: [],
      quotations: [],
    });
    prisma.purchaseRequest.update.mockResolvedValue({ id: 'pr-1', status: 'APPROVED' });

    await service.approve('c-1', 'pr-1', { action: 'approve' } as any, 'u-checker');

    expect(prisma.purchaseRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'APPROVED',
          approvedBy: 'u-checker',
        }),
      }),
    );
  });

  it('rejects approval of non-PENDING request', async () => {
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'pr-1',
      status: 'APPROVED',
      createdBy: 'u-maker',
      items: [],
      quotations: [],
    });

    await expect(
      service.approve('c-1', 'pr-1', { action: 'approve' } as any, 'u-checker'),
    ).rejects.toThrow(BadRequestException);
  });
});
