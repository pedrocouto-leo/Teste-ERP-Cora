import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CadocService } from './cadoc.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('CADOC')
@Controller('informes-legais/cadoc')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CadocController {
  constructor(private readonly cadocService: CadocService) {}

  @Post('3044')
  @ApiOperation({ summary: 'Gerar CADOC 3044 - Eventos Diários de Crédito' })
  async generate3044(
    @TenantId() companyId: string,
    @Query('date') date: string,
  ) {
    const result = await this.cadocService.generateCadoc3044(companyId, date);
    return { data: result };
  }

  @Post('4111')
  @ApiOperation({ summary: 'Gerar CADOC 4111 - Saldos Contábeis Diários' })
  async generate4111(
    @TenantId() companyId: string,
    @Query('date') date: string,
  ) {
    const result = await this.cadocService.generateCadoc4111(companyId, date);
    return { data: result };
  }
}
