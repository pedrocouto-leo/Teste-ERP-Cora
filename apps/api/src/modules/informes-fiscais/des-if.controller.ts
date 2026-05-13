import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DesIfService } from './des-if.service';
import { GenerateEfdContribuicoesDto } from './dto/efd-contribuicoes.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('DES-IF / ISSQN')
@Controller('informes-fiscais/des-if')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class DesIfController {
  constructor(private readonly desIfService: DesIfService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gerar DES-IF - Declaração Eletrônica de Serviços IF' })
  async generate(
    @TenantId() companyId: string,
    @Body() dto: GenerateEfdContribuicoesDto,
    @Query('municipalityCode') municipalityCode?: string,
  ) {
    const result = await this.desIfService.generate(
      companyId,
      dto.year,
      dto.month,
      municipalityCode,
    );
    return { data: result };
  }
}
