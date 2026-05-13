import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PddService } from './pdd.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('PDD - Provisão para Devedores Duvidosos')
@Controller('informes-legais/pdd')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PddController {
  constructor(private readonly pddService: PddService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calcular PDD conforme Res. CMN 4.966/2021' })
  async calculate(
    @TenantId() companyId: string,
    @Query('date') date: string,
  ) {
    const result = await this.pddService.calculate(companyId, date);
    return { data: result };
  }

  @Post('simulate')
  @ApiOperation({ summary: 'Simular PDD com cenário de stress' })
  async simulate(
    @TenantId() companyId: string,
    @Query('date') date: string,
    @Query('stressFactor') stressFactor?: string,
  ) {
    const factor = stressFactor ? parseFloat(stressFactor) : 1.5;
    const result = await this.pddService.simulate(companyId, date, factor);
    return { data: result };
  }
}
