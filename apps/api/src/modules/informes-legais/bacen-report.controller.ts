import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BacenReportService } from './bacen-report.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Relatórios BACEN')
@Controller('informes-legais/bacen')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class BacenReportController {
  constructor(private readonly bacenReportService: BacenReportService) {}

  @Post('6209')
  @ApiOperation({ summary: 'Gerar Doc 6209 - Estatísticas Varejo/Canais' })
  async generate6209(
    @TenantId() companyId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const result = await this.bacenReportService.generateDoc6209(
      companyId,
      parseInt(year),
      parseInt(month),
    );
    return { data: result };
  }

  @Post('informe-rendimentos')
  @ApiOperation({ summary: 'Gerar Informe de Rendimentos (IN 698/2006)' })
  async generateInformeRendimentos(
    @TenantId() companyId: string,
    @Query('year') year: string,
  ) {
    const result = await this.bacenReportService.generateInformeRendimentos(
      companyId,
      parseInt(year),
    );
    return { data: result };
  }

  @Get('tarifas')
  @ApiOperation({ summary: 'Tarifas e Encargos - Res. 3919 Art. 19' })
  async getTarifas(@TenantId() companyId: string) {
    const result = await this.bacenReportService.generateTarifasEncargos(companyId);
    return { data: result };
  }
}
