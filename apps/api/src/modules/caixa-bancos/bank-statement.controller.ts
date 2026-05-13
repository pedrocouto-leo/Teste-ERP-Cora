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
import { BankStatementService } from './bank-statement.service';
import { ImportStatementDto, ReconcileDto } from './dto/bank-statement.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Caixa e Bancos - Extratos')
@Controller('caixa-bancos/statements')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class BankStatementController {
  constructor(private readonly service: BankStatementService) {}

  @Post()
  @ApiOperation({ summary: 'Importar extrato bancario' })
  async importStatement(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ImportStatementDto,
  ) {
    const result = await this.service.importStatement(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar extratos bancarios' })
  @ApiQuery({ name: 'cashAccountId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['IMPORTED', 'RECONCILING', 'RECONCILED'] })
  async findAll(
    @TenantId() companyId: string,
    @Query('cashAccountId') cashAccountId?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.service.findAll(companyId, { cashAccountId, status });
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar extrato por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Get(':id/lines')
  @ApiOperation({ summary: 'Listar linhas do extrato' })
  async getLines(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.getLines(companyId, id);
    return { data: result };
  }

  @Post(':id/auto-reconcile')
  @ApiOperation({ summary: 'Conciliacao automatica do extrato' })
  async autoReconcile(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.autoReconcile(companyId, id);
    return { data: result };
  }

  @Post(':id/reconcile')
  @ApiOperation({ summary: 'Conciliacao manual (vincular linha do extrato a movimentacao)' })
  async manualReconcile(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @Body() dto: ReconcileDto,
  ) {
    const result = await this.service.manualReconcile(companyId, id, dto);
    return { data: result };
  }
}
