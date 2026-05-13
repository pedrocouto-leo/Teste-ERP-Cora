import { Controller, Post, Body, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { EfdContribuicoesService } from './efd-contribuicoes.service';
import { GenerateEfdContribuicoesDto } from './dto/efd-contribuicoes.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('EFD Contribuições')
@Controller('informes-fiscais/efd-contribuicoes')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class EfdContribuicoesController {
  constructor(private readonly service: EfdContribuicoesService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gerar escrituração EFD Contribuições PIS/COFINS' })
  async generate(
    @TenantId() companyId: string,
    @Body() dto: GenerateEfdContribuicoesDto,
  ) {
    const result = await this.service.generate(companyId, dto.year, dto.month);
    return { data: result };
  }

  @Post('export')
  @ApiOperation({ summary: 'Exportar arquivo SPED EFD Contribuições' })
  async exportFile(
    @TenantId() companyId: string,
    @Body() dto: GenerateEfdContribuicoesDto,
    @Res() res: Response,
  ) {
    const content = await this.service.exportFile(companyId, dto.year, dto.month);
    const filename = `EFD_CONTRIB_${dto.year}${String(dto.month).padStart(2, '0')}.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }
}
