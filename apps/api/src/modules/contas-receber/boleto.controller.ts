import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BoletoService } from './boleto.service';
import { GenerateBoletoDto } from './dto/boleto.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Contas a Receber - Boletos')
@Controller('contas-receber/boletos')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class BoletoController {
  constructor(private readonly service: BoletoService) {}

  @Post()
  @ApiOperation({ summary: 'Gerar boleto para titulo a receber' })
  async generate(
    @TenantId() companyId: string,
    @Body() dto: GenerateBoletoDto,
  ) {
    const result = await this.service.generate(companyId, dto);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar boletos' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('receivableId') receivableId?: string,
  ) {
    return this.service.findAll(companyId, pagination, {
      status,
      receivableId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar boleto por ID' })
  async findOne(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar boleto' })
  async cancel(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.service.cancel(companyId, id);
    return { data: result };
  }
}
