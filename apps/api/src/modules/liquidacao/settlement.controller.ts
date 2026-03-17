import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SettlementService } from './settlement.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { ApproveSettlementDto } from './dto/approve-settlement.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Liquidação Financeira')
@Controller('liquidacao/settlements')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class SettlementController {
  constructor(private readonly service: SettlementService) {}

  @Post()
  @ApiOperation({ summary: 'Criar liquidação financeira' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSettlementDto,
  ) {
    const result = await this.service.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar liquidações com filtros' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('sourceModule') sourceModule?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findAll(companyId, pagination, {
      status,
      type,
      sourceModule,
      dateFrom,
      dateTo,
    });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard de liquidações pendentes por tipo/módulo' })
  async getDashboard(@TenantId() companyId: string) {
    const result = await this.service.getDashboard(companyId);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar liquidação por ID' })
  async findOne(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar ou rejeitar liquidação (Maker/Checker)' })
  async approve(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApproveSettlementDto,
  ) {
    const result = await this.service.approve(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/settle')
  @ApiOperation({ summary: 'Efetivar liquidação aprovada' })
  async settle(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.service.settle(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar liquidação pendente' })
  async cancel(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.service.cancel(companyId, id, userId);
    return { data: result };
  }
}
