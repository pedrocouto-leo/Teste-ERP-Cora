import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DepreciationService } from './depreciation.service';
import { RunDepreciationDto } from './dto/depreciation.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Patrimônio - Depreciação')
@Controller('patrimonio/depreciation')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class DepreciationController {
  constructor(private readonly service: DepreciationService) {}

  @Post('run')
  @ApiOperation({ summary: 'Executar depreciação mensal para todos os ativos ativos' })
  async run(
    @TenantId() companyId: string,
    @Body() dto: RunDepreciationDto,
  ) {
    const result = await this.service.run(companyId, dto.year, dto.month);
    return { data: result };
  }

  @Get('simulate')
  @ApiOperation({ summary: 'Simular depreciação mensal sem gravar' })
  async simulate(
    @TenantId() companyId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const result = await this.service.simulate(
      companyId,
      parseInt(year),
      parseInt(month),
    );
    return { data: result };
  }

  @Post('close')
  @ApiOperation({ summary: 'Fechar período de depreciação' })
  async close(
    @TenantId() companyId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const result = await this.service.close(
      companyId,
      parseInt(year),
      parseInt(month),
    );
    return { data: result };
  }
}
