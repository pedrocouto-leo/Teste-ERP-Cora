import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EfdReinfService } from './efd-reinf.service';
import { GenerateEfdReinfDto, TransmitEfdReinfDto } from './dto/efd-reinf.dto';
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
  @ApiOperation({ summary: 'Transmitir evento para a RFB' })
  async transmit(@Body() dto: TransmitEfdReinfDto) {
    const result = await this.efdReinfService.transmit(
      dto.eventId,
      dto.certificateBase64,
    );
    return { data: result };
  }

  @Post('r9000')
  @ApiOperation({ summary: 'Gerar evento R-9000 (Exclusão)' })
  async generateR9000(@Query('eventId') eventId: string) {
    const result = await this.efdReinfService.generateR9000(eventId);
    return { data: result };
  }
}
