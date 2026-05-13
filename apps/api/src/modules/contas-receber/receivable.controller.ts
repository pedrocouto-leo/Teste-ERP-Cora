import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReceivableService } from './receivable.service';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { ReceivePaymentDto } from './dto/receive-payment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Contas a Receber - Titulos')
@Controller('contas-receber/titles')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ReceivableController {
  constructor(private readonly service: ReceivableService) {}

  @Post()
  @ApiOperation({ summary: 'Criar titulo a receber' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReceivableDto,
  ) {
    const result = await this.service.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar titulos a receber' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('dueDateFrom') dueDateFrom?: string,
    @Query('dueDateTo') dueDateTo?: string,
    @Query('overdue') overdue?: string,
  ) {
    return this.service.findAll(companyId, pagination, {
      status,
      clientId,
      dueDateFrom,
      dueDateTo,
      overdue,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar titulo a receber por ID' })
  async findOne(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar titulo a receber' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReceivableDto,
  ) {
    const result = await this.service.update(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/receive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar recebimento no titulo' })
  async receivePayment(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReceivePaymentDto,
  ) {
    const result = await this.service.receivePayment(
      companyId,
      id,
      dto,
      userId,
    );
    return { data: result };
  }

  @Post('mark-overdue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar titulos vencidos em lote' })
  async markOverdue(@TenantId() companyId: string) {
    const result = await this.service.markOverdue(companyId);
    return { data: result };
  }
}
