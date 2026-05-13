import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetGroupDto, UpdateAssetGroupDto } from './dto/asset-group.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AssetGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateAssetGroupDto) {
    const existing = await this.prisma.assetGroup.findUnique({
      where: { companyId_code: { companyId, code: dto.code } },
    });

    if (existing) {
      throw new ConflictException(`Grupo de ativos com código '${dto.code}' já existe`);
    }

    return this.prisma.assetGroup.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        usefulLife: dto.usefulLife,
        deprecRate: dto.deprecRate,
        accountId: dto.accountId,
        depAccountId: dto.depAccountId,
      },
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    filters: { search?: string; active?: boolean },
  ) {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (filters.active !== undefined) where.active = filters.active;
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.assetGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { assets: true } } },
      }),
      this.prisma.assetGroup.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const group = await this.prisma.assetGroup.findFirst({
      where: { id, companyId },
      include: { _count: { select: { assets: true } } },
    });

    if (!group) {
      throw new NotFoundException('Grupo de ativos não encontrado');
    }

    return group;
  }

  async update(companyId: string, id: string, dto: UpdateAssetGroupDto) {
    await this.findOne(companyId, id);

    if (dto.code) {
      const existing = await this.prisma.assetGroup.findFirst({
        where: { companyId, code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Grupo de ativos com código '${dto.code}' já existe`);
      }
    }

    return this.prisma.assetGroup.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.usefulLife !== undefined && { usefulLife: dto.usefulLife }),
        ...(dto.deprecRate !== undefined && { deprecRate: dto.deprecRate }),
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.depAccountId !== undefined && { depAccountId: dto.depAccountId }),
      },
    });
  }

  async delete(companyId: string, id: string) {
    await this.findOne(companyId, id);

    const assetCount = await this.prisma.asset.count({
      where: { groupId: id, status: 'ACTIVE' },
    });

    if (assetCount > 0) {
      throw new ConflictException(
        `Não é possível desativar grupo com ${assetCount} ativo(s) ativo(s)`,
      );
    }

    return this.prisma.assetGroup.update({
      where: { id },
      data: { active: false },
    });
  }
}
