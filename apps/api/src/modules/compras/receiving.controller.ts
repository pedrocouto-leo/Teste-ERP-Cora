import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReceivingService } from './receiving.service';
import { CreateReceivingDto } from './dto/receiving.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Recebimento de Compras')
@Controller('compras/receivings')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ReceivingController {
  constructor(private readonly service: ReceivingService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar recebimento de compra' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReceivingDto,
  ) {
    const result = await this.service.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar recebimentos' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.service.findAll(companyId, pagination, { status, orderId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar recebimento por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }
}
