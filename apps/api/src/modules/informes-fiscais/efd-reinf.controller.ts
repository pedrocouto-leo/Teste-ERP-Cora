import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EfdReinfService, ReinfEvent } from './efd-reinf.service';
import { GenerateEfdReinfDto } from './dto/efd-reinf.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('EFD-Reinf')
@Controller('informes-fiscais/efd-reinf')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class EfdReinfController {
  constructor(private readonly efdReinfService: EfdReinfService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gerar eventos EFD-Reinf do período' })
  async generate(
    @TenantId() companyId: string,
    @Body() dto: GenerateEfdReinfDto,
  ) {
    const result = await this.efdReinfService.generatePeriod(
      companyId,
      dto.year,
      dto.month,
    );
    return { data: result };
  }

  @Post('r1000')
  @ApiOperation({ summary: 'Gerar evento R-1000 (Informações do Contribuinte)' })
  async generateR1000(@TenantId() companyId: string) {
    const result = await this.efdReinfService.generateR1000(companyId);
    return { data: result };
  }

  @Post('transmit')
  @ApiOperation({ summary: 'Transmitir evento já gerado para a RFB' })
  async transmit(@Body() event: ReinfEvent) {
    const result = await this.efdReinfService.transmitEvent(event);
    return { data: result };
  }

  @Post('r9000')
  @ApiOperation({ summary: 'Gerar evento R-9000 (Exclusão de evento prévio)' })
  async generateR9000(
    @TenantId() companyId: string,
    @Query('eventType') eventType: 'R-4010' | 'R-4020',
    @Query('receipt') receipt: string,
  ) {
    const result = await this.efdReinfService.generateR9000(
      companyId,
      eventType,
      receipt,
    );
    return { data: result };
  }
}
