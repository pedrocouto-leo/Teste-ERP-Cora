import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/create-role.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Roles')
@Controller('auth/roles')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar role' })
  async create(@TenantId() companyId: string, @Body() dto: CreateRoleDto) {
    const result = await this.roleService.create(companyId, dto);
    return { data: result };
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar roles' })
  async findAll(@TenantId() companyId: string) {
    const result = await this.roleService.findAll(companyId);
    return { data: result };
  }

  @Get('permissions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar todas as permissões disponíveis' })
  async listPermissions() {
    const result = await this.roleService.listPermissions();
    return { data: result };
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Buscar role por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.roleService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar role' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const result = await this.roleService.update(companyId, id, dto);
    return { data: result };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar role' })
  async delete(@TenantId() companyId: string, @Param('id') id: string) {
    await this.roleService.delete(companyId, id);
  }
}
