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
import { SupplierService } from './supplier.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  ApproveSupplierDto,
} from './dto/supplier.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Suppliers')
@Controller('cadastro/suppliers')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar fornecedor (entra como PENDING)' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    const result = await this.supplierService.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar fornecedores' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.supplierService.findAll(companyId, pagination, search, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar fornecedor por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.supplierService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar fornecedor (volta para PENDING)' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    const result = await this.supplierService.update(companyId, id, dto, userId);
    return { data: result };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar/rejeitar fornecedor (Maker/Checker)' })
  async approve(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApproveSupplierDto,
  ) {
    const result = await this.supplierService.approve(companyId, id, dto, userId);
    return { data: result };
  }
}
