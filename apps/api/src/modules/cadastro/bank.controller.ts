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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BankService } from './bank.service';
import {
  CreateBankDto,
  CreateBankAgencyDto,
  CreateOwnBankAccountDto,
} from './dto/bank.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Banks')
@Controller('cadastro/banks')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class BankController {
  constructor(private readonly bankService: BankService) {}

  // ─── Banks ───────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Cadastrar banco' })
  async createBank(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBankDto,
  ) {
    const result = await this.bankService.createBank(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar bancos' })
  async findAllBanks(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.bankService.findAllBanks(companyId, pagination, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar banco por ID' })
  async findOneBank(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.bankService.findOneBank(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar banco' })
  async updateBank(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateBankDto>,
  ) {
    const result = await this.bankService.updateBank(
      companyId,
      id,
      dto,
      userId,
    );
    return { data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover banco' })
  async removeBank(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    const result = await this.bankService.removeBank(companyId, id);
    return { data: result };
  }

  // ─── Bank Agencies ───────────────────────────────────────

  @Post(':bankId/agencies')
  @ApiOperation({ summary: 'Cadastrar agência bancária' })
  async createAgency(
    @TenantId() companyId: string,
    @Param('bankId') bankId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBankAgencyDto,
  ) {
    const result = await this.bankService.createAgency(
      companyId,
      bankId,
      dto,
      userId,
    );
    return { data: result };
  }

  @Get(':bankId/agencies')
  @ApiOperation({ summary: 'Listar agências do banco' })
  async findAllAgencies(
    @TenantId() companyId: string,
    @Param('bankId') bankId: string,
  ) {
    const result = await this.bankService.findAllAgencies(companyId, bankId);
    return { data: result };
  }

  @Get(':bankId/agencies/:agencyId')
  @ApiOperation({ summary: 'Buscar agência por ID' })
  async findOneAgency(
    @TenantId() companyId: string,
    @Param('bankId') bankId: string,
    @Param('agencyId') agencyId: string,
  ) {
    const result = await this.bankService.findOneAgency(
      companyId,
      bankId,
      agencyId,
    );
    return { data: result };
  }

  @Patch(':bankId/agencies/:agencyId')
  @ApiOperation({ summary: 'Atualizar agência' })
  async updateAgency(
    @TenantId() companyId: string,
    @Param('bankId') bankId: string,
    @Param('agencyId') agencyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateBankAgencyDto>,
  ) {
    const result = await this.bankService.updateAgency(
      companyId,
      bankId,
      agencyId,
      dto,
      userId,
    );
    return { data: result };
  }

  @Delete(':bankId/agencies/:agencyId')
  @ApiOperation({ summary: 'Remover agência' })
  async removeAgency(
    @TenantId() companyId: string,
    @Param('bankId') bankId: string,
    @Param('agencyId') agencyId: string,
  ) {
    const result = await this.bankService.removeAgency(
      companyId,
      bankId,
      agencyId,
    );
    return { data: result };
  }
}

// ─── Own Bank Accounts Controller ────────────────────────────

@ApiTags('Own Bank Accounts')
@Controller('cadastro/bank-accounts')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class OwnBankAccountController {
  constructor(private readonly bankService: BankService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar conta bancária própria' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOwnBankAccountDto,
  ) {
    const result = await this.bankService.createOwnBankAccount(
      companyId,
      dto,
      userId,
    );
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar contas bancárias próprias' })
  async findAll(@TenantId() companyId: string) {
    const result = await this.bankService.findAllOwnBankAccounts(companyId);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conta bancária por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.bankService.findOneOwnBankAccount(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta bancária' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateOwnBankAccountDto>,
  ) {
    const result = await this.bankService.updateOwnBankAccount(
      companyId,
      id,
      dto,
      userId,
    );
    return { data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover conta bancária' })
  async remove(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.bankService.removeOwnBankAccount(companyId, id);
    return { data: result };
  }
}
