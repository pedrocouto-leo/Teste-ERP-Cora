import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-center.dto';

export interface CostCenterNode {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  children: CostCenterNode[];
  [key: string]: unknown;
}

@Injectable()
export class CostCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    dto: CreateCostCenterDto,
    createdBy: string,
  ) {
    const existing = await this.prisma.costCenter.findFirst({
      where: { companyId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        'Centro de custo com este código já cadastrado',
      );
    }

    if (dto.parentId) {
      const parent = await this.prisma.costCenter.findFirst({
        where: { id: dto.parentId, companyId },
      });
      if (!parent) {
        throw new NotFoundException('Centro de custo pai não encontrado');
      }
    }

    return this.prisma.costCenter.create({
      data: {
        companyId,
        ...dto,
        createdBy,
      },
    });
  }

  async findAll(companyId: string) {
    const costCenters = await this.prisma.costCenter.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });

    return this.buildTree(costCenters);
  }

  async findOne(companyId: string, id: string) {
    const costCenter = await this.prisma.costCenter.findFirst({
      where: { id, companyId },
    });

    if (!costCenter) {
      throw new NotFoundException('Centro de custo não encontrado');
    }

    return costCenter;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateCostCenterDto,
    updatedBy: string,
  ) {
    const costCenter = await this.findOne(companyId, id);

    if (dto.code && dto.code !== costCenter.code) {
      const existing = await this.prisma.costCenter.findFirst({
        where: { companyId, code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(
          'Centro de custo com este código já cadastrado',
        );
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException(
          'Centro de custo não pode ser pai de si mesmo',
        );
      }
      const parent = await this.prisma.costCenter.findFirst({
        where: { id: dto.parentId, companyId },
      });
      if (!parent) {
        throw new NotFoundException('Centro de custo pai não encontrado');
      }
    }

    return this.prisma.costCenter.update({
      where: { id: costCenter.id },
      data: { ...dto, updatedBy },
    });
  }

  async remove(companyId: string, id: string) {
    const costCenter = await this.findOne(companyId, id);

    const children = await this.prisma.costCenter.findFirst({
      where: { parentId: id, companyId },
    });

    if (children) {
      throw new ConflictException(
        'Não é possível excluir centro de custo com filhos',
      );
    }

    return this.prisma.costCenter.delete({
      where: { id: costCenter.id },
    });
  }

  private buildTree(
    items: Array<{ id: string; parentId: string | null; [key: string]: unknown }>,
  ): CostCenterNode[] {
    const map = new Map<string, CostCenterNode>();
    const roots: CostCenterNode[] = [];

    for (const item of items) {
      map.set(item.id, {
        ...item,
        code: item.code as string,
        name: item.name as string,
        children: [],
      } as CostCenterNode);
    }

    for (const item of items) {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
