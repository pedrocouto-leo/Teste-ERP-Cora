import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({
      where: { companyId, name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Já existe um role com este nome');
    }

    return this.prisma.role.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        rolePermissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.role.findMany({
      where: { companyId },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId },
      include: {
        rolePermissions: { include: { permission: true } },
        userRoles: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrado');
    }

    return role;
  }

  async update(companyId: string, id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrado');
    }

    if (dto.permissionIds) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        })),
      });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async delete(companyId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, companyId },
    });

    if (!role) {
      throw new NotFoundException('Role não encontrado');
    }

    await this.prisma.role.update({
      where: { id },
      data: { active: false },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }
}
