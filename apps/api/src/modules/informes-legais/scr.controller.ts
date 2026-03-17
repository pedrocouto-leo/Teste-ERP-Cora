import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ScrService } from './scr.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('SCR - Central de Riscos')
@Controller('informes-legais/scr')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ScrController {
  constructor(private readonly scrService: ScrService) {}

  @Post('3040')
  @ApiOperation({ summary: 'Gerar SCR Doc 3040 - Dados de Operações de Crédito' })
  async generate3040(
    @TenantId() companyId: string,
    @Query('date') date: string,
  ) {
    const result = await this.scrService.generateDoc3040(companyId, date);
    return { data: result };
  }

  @Post('3050')
  @ApiOperation({ summary: 'Gerar SCR Doc 3050 - Clientes com Responsabilidade >= R$200' })
  async generate3050(
    @TenantId() companyId: string,
    @Query('date') date: string,
  ) {
    const result = await this.scrService.generateDoc3050(companyId, date);
    return { data: result };
  }
}
