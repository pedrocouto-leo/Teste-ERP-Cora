import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    dto: CreateProjectDto,
    createdBy: string,
  ) {
    const existing = await this.prisma.project.findFirst({
      where: { companyId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Projeto com este código já cadastrado');
    }

    if (!dto.startDate) {
      throw new BadRequestException('startDate é obrigatório');
    }

    return this.prisma.project.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdBy,
      },
    });
  }

  async findAll(
    companyId: string,
    pagination: PaginationDto,
    search?: string,
  ) {
    const { page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = { companyId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return project;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateProjectDto,
    updatedBy: string,
  ) {
    const project = await this.findOne(companyId, id);

    if (dto.code && dto.code !== project.code) {
      const existing = await this.prisma.project.findFirst({
        where: { companyId, code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Projeto com este código já cadastrado');
      }
    }

    const data: Prisma.ProjectUpdateInput = { updatedBy };
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    return this.prisma.project.update({
      where: { id: project.id },
      data,
    });
  }

  async remove(companyId: string, id: string) {
    const project = await this.findOne(companyId, id);
    return this.prisma.project.delete({ where: { id: project.id } });
  }
}
