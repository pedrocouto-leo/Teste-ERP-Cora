import {
  Controller,
  Get,
  Post,
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
import { JournalEntryService } from './journal-entry.service';
import { CreateJournalEntryDto, ApproveEntryDto } from './dto/journal-entry.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Lançamentos Contábeis')
@Controller('contabilidade/entries')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class JournalEntryController {
  constructor(private readonly service: JournalEntryService) {}

  @Post()
  @ApiOperation({ summary: 'Criar lançamento contábil' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    const result = await this.service.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar lançamentos contábeis' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('periodId') periodId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(companyId, pagination, {
      periodId,
      status,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lançamento contábil por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submeter lançamento para aprovação' })
  async submit(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.service.submit(companyId, id, userId);
    return { data: result };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprovar/rejeitar lançamento (Maker/Checker)' })
  async approve(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ApproveEntryDto,
  ) {
    const result = await this.service.approve(companyId, id, dto, userId);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir lançamento (somente DRAFT)' })
  async delete(
    @TenantId() companyId: string,
    @Param('id') id: string,
  ) {
    await this.service.delete(companyId, id);
  }
}
