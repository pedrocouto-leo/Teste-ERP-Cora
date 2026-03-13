import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CostCenterService } from './cost-center.service';
import {
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-center.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Cost Centers')
@Controller('cadastro/cost-centers')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CostCenterController {
  constructor(private readonly costCenterService: CostCenterService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar centro de custo' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCostCenterDto,
  ) {
    const result = await this.costCenterService.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar centros de custo (árvore)' })
  async findAll(@TenantId() companyId: string) {
    const result = await this.costCenterService.findAll(companyId);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar centro de custo por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.costCenterService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar centro de custo' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCostCenterDto,
  ) {
    const result = await this.costCenterService.update(
      companyId,
      id,
      dto,
      userId,
    );
    return { data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover centro de custo' })
  async remove(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.costCenterService.remove(companyId, id);
    return { data: result };
  }
}
