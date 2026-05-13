import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { DdrService } from './ddr.service';
import { DdrCalculationService } from './ddr-calculation.service';
import { DdrExportService } from './ddr-export.service';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { TenantId } from '../../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateDdrReportDto } from './dto/create-ddr-report.dto';
import { UpdateDdrReportDto } from './dto/update-ddr-report.dto';
import { CreateDdrEntryDto } from './dto/create-ddr-entry.dto';
import { CreateDdrParameterDto } from './dto/ddr-parameter.dto';
import { DdrFilterDto } from './dto/ddr-filter.dto';

@ApiTags('DDR - Documento 2011')
@Controller('informes-legais/ddr')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class DdrController {
  constructor(
    private readonly ddrService: DdrService,
    private readonly ddrCalculationService: DdrCalculationService,
    private readonly ddrExportService: DdrExportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar relatório DDR para uma data-base' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateDdrReportDto,
  ) {
    const data = await this.ddrService.create(companyId, user.id, dto);
    return { data };
  }

  @Get()
  @ApiOperation({ summary: 'Listar relatórios DDR com filtros' })
  async findAll(
    @TenantId() companyId: string,
    @Query() filter: DdrFilterDto,
  ) {
    return this.ddrService.findAll(companyId, filter);
  }

  @Get('daily-summary')
  @ApiOperation({ summary: 'Resumo da posição cambial do dia' })
  async dailySummary(
    @TenantId() companyId: string,
    @Query('date') date: string,
  ) {
    const data = await this.ddrService.getDailySummary(companyId, date);
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter relatório DDR completo' })
  async findOne(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.ddrService.findOne(companyId, id);
    return { data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar relatório DDR' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateDdrReportDto,
  ) {
    const data = await this.ddrService.update(companyId, id, user.id, dto);
    return { data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir rascunho DDR' })
  async remove(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    await this.ddrService.remove(companyId, id);
    return { message: 'DDR excluído com sucesso' };
  }

  // --- Entries ---

  @Post(':id/entries')
  @ApiOperation({ summary: 'Adicionar/atualizar lançamento DDR' })
  async upsertEntry(
    @TenantId() companyId: string,
    @Param('id') reportId: string,
    @Body() dto: CreateDdrEntryDto,
  ) {
    const data = await this.ddrService.upsertEntry(companyId, reportId, dto);
    return { data };
  }

  @Post(':id/entries/batch')
  @ApiOperation({ summary: 'Importação em lote de lançamentos' })
  async batchEntries(
    @TenantId() companyId: string,
    @Param('id') reportId: string,
    @Body() body: { entries: CreateDdrEntryDto[] },
  ) {
    const data = await this.ddrService.batchUpsertEntries(companyId, reportId, body.entries);
    return { data, meta: { count: data.length } };
  }

  @Delete(':id/entries/:entryId')
  @ApiOperation({ summary: 'Remover lançamento DDR' })
  async removeEntry(
    @TenantId() companyId: string,
    @Param('id') reportId: string,
    @Param('entryId') entryId: string,
  ) {
    await this.ddrService.removeEntry(companyId, reportId, entryId);
    return { message: 'Lançamento removido' };
  }

  // --- Parameters ---

  @Post(':id/parameters')
  @ApiOperation({ summary: 'Adicionar/atualizar parâmetro de cálculo' })
  async upsertParameter(
    @TenantId() companyId: string,
    @Param('id') reportId: string,
    @Body() dto: CreateDdrParameterDto,
  ) {
    const data = await this.ddrService.upsertParameter(companyId, reportId, dto);
    return { data };
  }

  // --- Calculations ---

  @Post(':id/calculate')
  @ApiOperation({ summary: 'Calcular contas derivadas (RWACAM, RWAMPAD, etc.)' })
  async calculate(
    @TenantId() companyId: string,
    @Param('id') reportId: string,
  ) {
    await this.ddrService.findOne(companyId, reportId);
    const data = await this.ddrCalculationService.calculateDerivedAccounts(reportId);
    return { data };
  }

  // --- Validation ---

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validar consistência do DDR' })
  async validate(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const data = await this.ddrService.validate(companyId, id);
    return { data };
  }

  // --- Workflow ---

  @Post(':id/submit-review')
  @ApiOperation({ summary: 'Enviar para revisão (DRAFT → PENDING_REVIEW)' })
  async submitForReview(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.ddrService.submitForReview(companyId, id, user.id);
    return { data };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar DDR (maker/checker)' })
  async approve(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.ddrService.approve(companyId, id, user.id);
    return { data };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeitar DDR' })
  async reject(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { reason: string },
  ) {
    const data = await this.ddrService.reject(companyId, id, user.id, body.reason);
    return { data };
  }

  // --- Export ---

  @Post(':id/export')
  @ApiOperation({ summary: 'Exportar DDR no formato XML para Sisbacen' })
  async export(
    @TenantId() companyId: string,
    @Param('id') reportId: string,
    @Res() res: Response,
  ) {
    const xml = await this.ddrExportService.exportToXml(companyId, reportId);

    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="DDR_2011_${reportId}.xml"`,
    });
    res.send(xml);
  }
}
