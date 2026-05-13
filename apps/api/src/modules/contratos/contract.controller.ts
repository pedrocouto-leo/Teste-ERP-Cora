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
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateAddendumDto } from './dto/contract-addendum.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Contratos')
@Controller('contratos')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  @ApiOperation({ summary: 'Criar contrato' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateContractDto,
  ) {
    const result = await this.contractService.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar contratos com filtros' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('supplierId') supplierId?: string,
    @Query('startDateFrom') startDateFrom?: string,
    @Query('startDateTo') startDateTo?: string,
  ) {
    return this.contractService.findAll(companyId, pagination, {
      status,
      type,
      supplierId,
      startDateFrom,
      startDateTo,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar contrato por ID com parcelas e aditivos' })
  async findOne(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.contractService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar contrato (somente DRAFT)' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateContractDto,
  ) {
    const result = await this.contractService.update(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar ou rejeitar contrato (Maker/Checker)' })
  async approve(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('action') action: 'approve' | 'reject',
  ) {
    const result = await this.contractService.approve(companyId, id, action, userId);
    return { data: result };
  }

  @Post(':id/installments/:installmentId/release')
  @ApiOperation({ summary: 'Liberar parcela do contrato (gera título a pagar)' })
  async releaseInstallment(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @Param('installmentId') installmentId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.contractService.releaseInstallment(
      companyId,
      id,
      installmentId,
      userId,
    );
    return { data: result };
  }

  @Post(':id/addendums')
  @ApiOperation({ summary: 'Adicionar aditivo ao contrato' })
  async addAddendum(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddendumDto,
  ) {
    const result = await this.contractService.addAddendum(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renovar contrato (cria novo contrato a partir do existente)' })
  async renew(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.contractService.renew(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspender contrato ativo' })
  async suspend(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.contractService.suspend(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reativar contrato suspenso' })
  async reactivate(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.contractService.reactivate(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/finish')
  @ApiOperation({ summary: 'Finalizar contrato' })
  async finish(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.contractService.finish(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar contrato' })
  async cancel(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.contractService.cancel(companyId, id, userId);
    return { data: result };
  }
}
