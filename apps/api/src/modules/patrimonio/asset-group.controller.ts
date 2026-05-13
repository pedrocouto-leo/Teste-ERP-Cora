import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AssetGroupService } from './asset-group.service';
import { CreateAssetGroupDto, UpdateAssetGroupDto } from './dto/asset-group.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Patrimônio - Grupos de Ativos')
@Controller('patrimonio/groups')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AssetGroupController {
  constructor(private readonly service: AssetGroupService) {}

  @Post()
  @ApiOperation({ summary: 'Criar grupo de ativos' })
  async create(@TenantId() companyId: string, @Body() dto: CreateAssetGroupDto) {
    const result = await this.service.create(companyId, dto);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar grupos de ativos' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    return this.service.findAll(companyId, pagination, {
      search,
      active: active !== undefined ? active === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar grupo de ativos por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar grupo de ativos' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssetGroupDto,
  ) {
    const result = await this.service.update(companyId, id, dto);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar grupo de ativos' })
  async delete(@TenantId() companyId: string, @Param('id') id: string) {
    await this.service.delete(companyId, id);
  }
}
