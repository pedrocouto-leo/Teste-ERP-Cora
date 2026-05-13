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
import { AccountService } from './account.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Contas Contábeis')
@Controller('contabilidade/accounts')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Post()
  @ApiOperation({ summary: 'Criar conta contábil' })
  async create(@TenantId() companyId: string, @Body() dto: CreateAccountDto) {
    const result = await this.service.create(companyId, dto);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar contas contábeis' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('chartId') chartId?: string,
    @Query('type') type?: string,
    @Query('level') level?: string,
    @Query('cosifCode') cosifCode?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(companyId, pagination, {
      chartId,
      type,
      level: level ? parseInt(level) : undefined,
      cosifCode,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar conta contábil por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar conta contábil' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const result = await this.service.update(companyId, id, dto);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar conta contábil' })
  async delete(@TenantId() companyId: string, @Param('id') id: string) {
    await this.service.delete(companyId, id);
  }
}
