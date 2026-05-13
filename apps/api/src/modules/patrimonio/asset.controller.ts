import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AssetService } from './asset.service';
import { CreateAssetDto, UpdateAssetDto, WriteOffDto, TransferDto } from './dto/asset.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Patrimônio - Ativos')
@Controller('patrimonio/assets')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AssetController {
  constructor(private readonly service: AssetService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar ativo imobilizado' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAssetDto,
  ) {
    const result = await this.service.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar ativos imobilizados' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('groupId') groupId?: string,
    @Query('branchId') branchId?: string,
    @Query('costCenterId') costCenterId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(companyId, pagination, {
      status,
      groupId,
      branchId,
      costCenterId,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ativo por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar ativo imobilizado' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAssetDto,
  ) {
    const result = await this.service.update(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/write-off')
  @ApiOperation({ summary: 'Baixar ativo imobilizado' })
  async writeOff(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: WriteOffDto,
  ) {
    const result = await this.service.writeOff(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transferir ativo para outro CC/filial' })
  async transfer(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TransferDto,
  ) {
    const result = await this.service.transfer(companyId, id, dto, userId);
    return { data: result };
  }

  @Get(':id/depreciations')
  @ApiOperation({ summary: 'Histórico de depreciação do ativo' })
  async getDepreciations(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.service.getDepreciations(companyId, id);
    return { data: result };
  }
}
