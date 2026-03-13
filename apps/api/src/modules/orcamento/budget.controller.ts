import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BudgetService } from './budget.service';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  ApproveBudgetDto,
  ReplicateBudgetDto,
} from './dto/budget.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Budget')
@Controller('orcamento/budgets')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo orçamento' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    const result = await this.budgetService.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar orçamentos' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('year') year?: number,
  ) {
    return this.budgetService.findAll(companyId, pagination, status, year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.budgetService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar orçamento (somente rascunho)' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    const result = await this.budgetService.update(companyId, id, dto);
    return { data: result };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar/rejeitar orçamento (Maker/Checker)' })
  async approve(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApproveBudgetDto,
  ) {
    const result = await this.budgetService.approve(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Ativar orçamento aprovado (desativa outros do mesmo ano)' })
  async activate(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.budgetService.activate(companyId, id);
    return { data: result };
  }

  @Post('replicate')
  @ApiOperation({ summary: 'Replicar orçamento de outro ano/versão' })
  async replicate(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReplicateBudgetDto,
  ) {
    const result = await this.budgetService.replicate(companyId, dto, userId);
    return { data: result };
  }
}
