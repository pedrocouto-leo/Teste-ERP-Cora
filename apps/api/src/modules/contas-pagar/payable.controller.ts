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
import { PayableService } from './payable.service';
import { CreatePayableDto } from './dto/create-payable.dto';
import { UpdatePayableDto } from './dto/update-payable.dto';
import { ApprovePayableDto } from './dto/approve-payable.dto';
import { ProcessPaymentDto } from './dto/payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Contas a Pagar')
@Controller('contas-pagar/titles')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PayableController {
  constructor(private readonly payableService: PayableService) {}

  @Post()
  @ApiOperation({ summary: 'Criar título a pagar' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePayableDto,
  ) {
    const result = await this.payableService.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar títulos a pagar com filtros' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('approvalStatus') approvalStatus?: string,
    @Query('supplierId') supplierId?: string,
    @Query('dueDateFrom') dueDateFrom?: string,
    @Query('dueDateTo') dueDateTo?: string,
    @Query('overdue') overdue?: boolean,
  ) {
    return this.payableService.findAll(companyId, pagination, {
      status,
      approvalStatus,
      supplierId,
      dueDateFrom,
      dueDateTo,
      overdue,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar título a pagar por ID' })
  async findOne(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.payableService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar título a pagar (somente pendente de aprovação)' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePayableDto,
  ) {
    const result = await this.payableService.update(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar ou rejeitar título a pagar (Maker/Checker)' })
  async approve(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApprovePayableDto,
  ) {
    const result = await this.payableService.approve(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Processar pagamento de título aprovado' })
  async processPayment(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    const result = await this.payableService.processPayment(companyId, id, dto, userId);
    return { data: result };
  }

  @Post('mark-overdue')
  @ApiOperation({ summary: 'Marcar títulos vencidos como OVERDUE (batch)' })
  async markOverdue(@TenantId() companyId: string) {
    const result = await this.payableService.markOverdue(companyId);
    return { data: result };
  }
}
