import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { CreateChartOfAccountsDto, UpdateChartOfAccountsDto } from './dto/chart-of-accounts.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Plano de Contas')
@Controller('contabilidade/charts')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ChartOfAccountsController {
  constructor(private readonly service: ChartOfAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar plano de contas' })
  async create(@TenantId() companyId: string, @Body() dto: CreateChartOfAccountsDto) {
    const result = await this.service.create(companyId, dto);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar planos de contas' })
  async findAll(@TenantId() companyId: string) {
    const result = await this.service.findAll(companyId);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar plano de contas por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Get(':id/tree')
  @ApiOperation({ summary: 'Obter árvore completa de contas do plano' })
  async getTree(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.getTree(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar plano de contas' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChartOfAccountsDto,
  ) {
    const result = await this.service.update(companyId, id, dto);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar plano de contas' })
  async delete(@TenantId() companyId: string, @Param('id') id: string) {
    await this.service.delete(companyId, id);
  }
}
