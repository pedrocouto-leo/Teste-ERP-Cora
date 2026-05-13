import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CashMovementService } from './cash-movement.service';
import { CreateCashMovementDto, TransferDto } from './dto/cash-movement.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Caixa e Bancos - Movimentacoes')
@Controller('caixa-bancos/movements')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CashMovementController {
  constructor(private readonly service: CashMovementService) {}

  @Post()
  @ApiOperation({ summary: 'Criar movimentacao manual' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCashMovementDto,
  ) {
    const result = await this.service.create(companyId, dto, userId);
    return { data: result };
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transferencia entre contas' })
  async transfer(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TransferDto,
  ) {
    const result = await this.service.transfer(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar movimentacoes com filtros' })
  @ApiQuery({ name: 'cashAccountId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'category', required: false, enum: ['MANUAL', 'AP_PAYMENT', 'AR_RECEIPT', 'TRANSFER', 'CNAB'] })
  @ApiQuery({ name: 'type', required: false, enum: ['CREDIT', 'DEBIT'] })
  @ApiQuery({ name: 'reconciled', required: false, type: Boolean })
  async findAll(
    @TenantId() companyId: string,
    @Query('cashAccountId') cashAccountId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('reconciled') reconciled?: string,
  ) {
    const result = await this.service.findAll(companyId, {
      cashAccountId,
      dateFrom,
      dateTo,
      category,
      type,
      reconciled: reconciled !== undefined ? reconciled === 'true' : undefined,
    });
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar movimentacao por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }
}
