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
import { InvoiceService } from './invoice.service';
import { NfseService } from './nfse.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Faturamento')
@Controller('faturamento/invoices')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly nfseService: NfseService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar fatura' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    const result = await this.invoiceService.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar faturas' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('nfseStatus') nfseStatus?: string,
    @Query('issueDateFrom') issueDateFrom?: string,
    @Query('issueDateTo') issueDateTo?: string,
  ) {
    return this.invoiceService.findAll(companyId, pagination, {
      status,
      clientId,
      nfseStatus,
      issueDateFrom,
      issueDateTo,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar fatura por ID' })
  async findOne(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.invoiceService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar fatura (somente DRAFT)' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    const result = await this.invoiceService.update(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/issue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Emitir fatura (DRAFT -> ISSUED)' })
  async issue(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.invoiceService.issue(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar fatura' })
  async cancel(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.invoiceService.cancel(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/nfse/emit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Emitir NFS-e para a fatura' })
  async emitNfse(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.nfseService.emitNfse(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/nfse/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar NFS-e da fatura' })
  async cancelNfse(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.nfseService.cancelNfse(companyId, id, userId);
    return { data: result };
  }

  @Get(':id/nfse/status')
  @ApiOperation({ summary: 'Consultar status da NFS-e' })
  async checkNfseStatus(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.nfseService.checkStatus(companyId, id);
    return { data: result };
  }
}
