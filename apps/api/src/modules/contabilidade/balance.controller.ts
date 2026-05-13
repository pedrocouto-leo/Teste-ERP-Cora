import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BalanceService } from './balance.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Demonstrações Contábeis')
@Controller('contabilidade/balances')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class BalanceController {
  constructor(private readonly service: BalanceService) {}

  @Get('trial-balance')
  @ApiOperation({ summary: 'Balancete de verificação' })
  async trialBalance(
    @TenantId() companyId: string,
    @Query('periodId') periodId: string,
  ) {
    const result = await this.service.getTrialBalance(companyId, periodId);
    return { data: result };
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balanço patrimonial' })
  async balanceSheet(
    @TenantId() companyId: string,
    @Query('periodId') periodId: string,
  ) {
    const result = await this.service.getBalanceSheet(companyId, periodId);
    return { data: result };
  }

  @Get('income-statement')
  @ApiOperation({ summary: 'Demonstração de resultado (DRE)' })
  async incomeStatement(
    @TenantId() companyId: string,
    @Query('periodId') periodId: string,
  ) {
    const result = await this.service.getIncomeStatement(companyId, periodId);
    return { data: result };
  }
}
