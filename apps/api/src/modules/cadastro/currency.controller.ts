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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrencyService } from './currency.service';
import {
  CreateCurrencyDto,
  CreateExchangeRateDto,
} from './dto/currency.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Currencies')
@Controller('cadastro/currencies')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar moeda' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCurrencyDto,
  ) {
    const result = await this.currencyService.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar moedas' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.currencyService.findAll(companyId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar moeda por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.currencyService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar moeda' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateCurrencyDto>,
  ) {
    const result = await this.currencyService.update(
      companyId,
      id,
      dto,
      userId,
    );
    return { data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover moeda' })
  async remove(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.currencyService.remove(companyId, id);
    return { data: result };
  }

  // ─── Exchange Rates ──────────────────────────────────────

  @Post(':currencyId/exchange-rates')
  @ApiOperation({ summary: 'Cadastrar taxa de câmbio' })
  async createExchangeRate(
    @TenantId() companyId: string,
    @Param('currencyId') currencyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateExchangeRateDto,
  ) {
    const result = await this.currencyService.createExchangeRate(
      companyId,
      currencyId,
      dto,
      userId,
    );
    return { data: result };
  }

  @Get(':currencyId/exchange-rates')
  @ApiOperation({ summary: 'Listar taxas de câmbio' })
  async findAllExchangeRates(
    @TenantId() companyId: string,
    @Param('currencyId') currencyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.currencyService.findAllExchangeRates(
      companyId,
      currencyId,
      startDate,
      endDate,
    );
    return { data: result };
  }

  @Delete(':currencyId/exchange-rates/:rateId')
  @ApiOperation({ summary: 'Remover taxa de câmbio' })
  async removeExchangeRate(
    @TenantId() companyId: string,
    @Param('currencyId') currencyId: string,
    @Param('rateId') rateId: string,
  ) {
    const result = await this.currencyService.removeExchangeRate(
      companyId,
      currencyId,
      rateId,
    );
    return { data: result };
  }
}
