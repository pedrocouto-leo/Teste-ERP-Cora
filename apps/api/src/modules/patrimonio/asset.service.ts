import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto, WriteOffDto, TransferDto } from './dto/asset.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateAssetDto, createdBy: string) {
    // Validate group exists and belongs to company
    const group = await this.prisma.assetGroup.findFirst({
      where: { id: dto.groupId, companyId, active: true },
    });

    if (!group) {
      throw new NotFoundException('Grupo de ativos não encontrado ou inativo');
    }

    // Check unique asset number
    const existing = await this.prisma.asset.findUnique({
      where: { companyId_assetNumber: { companyId, assetNumber: dto.assetNumber } },
    });

    if (existing) {
      throw new ConflictException(`Ativo com número '${dto.assetNumber}' já existe`);
    }

    const residualValue = dto.residualValue ?? 0;
    const currentValue = dto.acquisitionValue;

    return this.prisma.asset.create({
      data: {
        companyId,
        assetNumber: dto.assetNumber,
        description: dto.description,
        groupId: dto.groupId,
        acquisitionDate: new Date(dto.acquisitionDate),
        acquisitionValue: dto.acquisitionValue,
        residualValue,
        currentValue,
        accumulatedDeprec: 0,
        costCenterId: dto.costCenterId,
        branchId: dto.branchId,
        location: dto.location,
        serialNumber: dto.serialNumber,
        invoiceNumber: dto.invoiceNumber,
        supplierId: dto.supplierId,
        status: 'ACTIVE',
        createdBy,
      },
      include: { group: true },
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    filters: {
      status?: string;
      groupId?: string;
      branchId?: string;
      costCenterId?: string;
      search?: string;
    },
  ) {
    const { page = 1, limit = 20, sortBy = 'assetNumber', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.groupId) where.groupId = filters.groupId;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.costCenterId) where.costCenterId = filters.costCenterId;

    if (filters.search) {
      where.OR = [
        { assetNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { serialNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { group: true },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, companyId },
      include: {
        group: true,
        depreciations: { orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }] },
        transfers: { orderBy: { transferDate: 'desc' } },
      },
    });

    if (!asset) {
      throw new NotFoundException('Ativo não encontrado');
    }

    return asset;
  }

  async update(companyId: string, id: string, dto: UpdateAssetDto, updatedBy: string) {
    const asset = await this.findOne(companyId, id);

    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Ativo com status ${asset.status} não pode ser alterado`,
      );
    }

    if (dto.assetNumber) {
      const existing = await this.prisma.asset.findFirst({
        where: { companyId, assetNumber: dto.assetNumber, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Ativo com número '${dto.assetNumber}' já existe`);
      }
    }

    if (dto.groupId) {
      const group = await this.prisma.assetGroup.findFirst({
        where: { id: dto.groupId, companyId, active: true },
      });
      if (!group) {
        throw new NotFoundException('Grupo de ativos não encontrado ou inativo');
      }
    }

    const updateData: Record<string, unknown> = { updatedBy };

    if (dto.assetNumber !== undefined) updateData.assetNumber = dto.assetNumber;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.groupId !== undefined) updateData.groupId = dto.groupId;
    if (dto.acquisitionDate !== undefined) updateData.acquisitionDate = new Date(dto.acquisitionDate);
    if (dto.acquisitionValue !== undefined) updateData.acquisitionValue = dto.acquisitionValue;
    if (dto.residualValue !== undefined) updateData.residualValue = dto.residualValue;
    if (dto.costCenterId !== undefined) updateData.costCenterId = dto.costCenterId;
    if (dto.branchId !== undefined) updateData.branchId = dto.branchId;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.serialNumber !== undefined) updateData.serialNumber = dto.serialNumber;
    if (dto.invoiceNumber !== undefined) updateData.invoiceNumber = dto.invoiceNumber;
    if (dto.supplierId !== undefined) updateData.supplierId = dto.supplierId;

    return this.prisma.asset.update({
      where: { id },
      data: updateData,
      include: { group: true },
    });
  }

  async writeOff(companyId: string, id: string, dto: WriteOffDto, userId: string) {
    const asset = await this.findOne(companyId, id);

    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Somente ativos com status ACTIVE podem ser baixados. Status atual: ${asset.status}`,
      );
    }

    return this.prisma.asset.update({
      where: { id },
      data: {
        status: 'WRITTEN_OFF',
        currentValue: 0,
        writtenOffAt: new Date(),
        writtenOffBy: userId,
        updatedBy: userId,
      },
      include: { group: true },
    });
  }

  async transfer(companyId: string, id: string, dto: TransferDto, userId: string) {
    const asset = await this.findOne(companyId, id);

    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Somente ativos com status ACTIVE podem ser transferidos. Status atual: ${asset.status}`,
      );
    }

    if (!dto.toCostCenter && !dto.toBranch) {
      throw new BadRequestException(
        'Informe ao menos um destino: centro de custo ou filial',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Create transfer record
      await tx.assetTransfer.create({
        data: {
          assetId: id,
          fromCostCenter: asset.costCenterId,
          toCostCenter: dto.toCostCenter,
          fromBranch: asset.branchId,
          toBranch: dto.toBranch,
          transferDate: new Date(),
          reason: dto.reason,
          createdBy: userId,
        },
      });

      // Update the asset
      const updateData: Record<string, unknown> = { updatedBy: userId };
      if (dto.toCostCenter !== undefined) updateData.costCenterId = dto.toCostCenter;
      if (dto.toBranch !== undefined) updateData.branchId = dto.toBranch;

      return tx.asset.update({
        where: { id },
        data: updateData,
        include: { group: true },
      });
    });
  }

  async getDepreciations(companyId: string, id: string) {
    await this.findOne(companyId, id);

    return this.prisma.assetDepreciation.findMany({
      where: { assetId: id },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }
}
