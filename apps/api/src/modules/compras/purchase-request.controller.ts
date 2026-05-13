import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PurchaseRequestService } from './purchase-request.service';
import { CreatePurchaseRequestDto, ApprovePurchaseRequestDto } from './dto/purchase-request.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Solicitações de Compra')
@Controller('compras/requests')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PurchaseRequestController {
  constructor(private readonly service: PurchaseRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Criar solicitação de compra' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    const result = await this.service.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitações de compra' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(companyId, pagination, { status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar solicitação por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprovar/rejeitar solicitação' })
  async approve(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApprovePurchaseRequestDto,
  ) {
    const result = await this.service.approve(companyId, id, dto, userId);
    return { data: result };
  }
}
