import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto, SelectQuotationDto } from './dto/quotation.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cotações')
@Controller('compras/quotations')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class QuotationController {
  constructor(private readonly service: QuotationService) {}

  @Post()
  @ApiOperation({ summary: 'Criar cotação' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateQuotationDto,
  ) {
    const result = await this.service.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotações' })
  async findAll(
    @TenantId() companyId: string,
    @Query('purchaseRequestId') purchaseRequestId?: string,
  ) {
    const result = await this.service.findAll(companyId, purchaseRequestId);
    return { data: result };
  }

  @Get('compare/:purchaseRequestId')
  @ApiOperation({ summary: 'Comparar cotações de uma solicitação' })
  async compare(
    @TenantId() companyId: string,
    @Param('purchaseRequestId') purchaseRequestId: string,
  ) {
    const result = await this.service.compare(companyId, purchaseRequestId);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cotação por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Post(':id/select')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Selecionar/rejeitar cotação' })
  async select(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SelectQuotationDto,
  ) {
    const result = await this.service.select(companyId, id, dto, userId);
    return { data: result };
  }
}
