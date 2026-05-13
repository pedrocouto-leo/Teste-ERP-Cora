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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CashAccountService } from './cash-account.service';
import { CreateCashAccountDto, UpdateCashAccountDto } from './dto/cash-account.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Caixa e Bancos - Contas')
@Controller('caixa-bancos/accounts')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CashAccountController {
  constructor(private readonly service: CashAccountService) {}

  @Post()
  @ApiOperation({ summary: 'Criar conta caixa/banco' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCashAccountDto,
  ) {
    const result = await this.service.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar contas caixa/banco' })
  @ApiQuery({ name: 'type', required: false, enum: ['CASH', 'BANK', 'INVESTMENT'] })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async findAll(
    @TenantId() companyId: string,
    @Query('type') type?: string,
    @Query('active') active?: string,
  ) {
    const result = await this.service.findAll(companyId, {
      type,
      active: active !== undefined ? active === 'true' : undefined,
    });
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conta caixa/banco por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Consultar saldo da conta' })
  async getBalance(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.getBalance(companyId, id);
    return { data: result };
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Listar movimentacoes da conta' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMovements(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.service.getMovements(companyId, id, {
      dateFrom,
      dateTo,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta caixa/banco' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCashAccountDto,
  ) {
    const result = await this.service.update(companyId, id, dto, userId);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar conta caixa/banco' })
  async deactivate(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.service.deactivate(companyId, id, userId);
  }
}
