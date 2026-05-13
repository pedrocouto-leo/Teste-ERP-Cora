import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AccountingPeriodService } from './accounting-period.service';
import { CreateAccountingPeriodDto } from './dto/accounting-period.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Períodos Contábeis')
@Controller('contabilidade/periods')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AccountingPeriodController {
  constructor(private readonly service: AccountingPeriodService) {}

  @Post()
  @ApiOperation({ summary: 'Criar período contábil' })
  async create(@TenantId() companyId: string, @Body() dto: CreateAccountingPeriodDto) {
    const result = await this.service.create(companyId, dto);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar períodos contábeis' })
  async findAll(
    @TenantId() companyId: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.service.findAll(companyId, {
      year: year ? parseInt(year) : undefined,
      status,
    });
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar período contábil por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fechar período contábil' })
  async close(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.service.close(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/reopen')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reabrir período contábil (ADMIN)' })
  async reopen(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.reopen(companyId, id);
    return { data: result };
  }
}
