import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StandardEntryService } from './standard-entry.service';
import { CreateStandardEntryDto } from './dto/standard-entry.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Modelos de Lançamento')
@Controller('contabilidade/standard-entries')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class StandardEntryController {
  constructor(private readonly service: StandardEntryService) {}

  @Post()
  @ApiOperation({ summary: 'Criar modelo de lançamento' })
  async create(@TenantId() companyId: string, @Body() dto: CreateStandardEntryDto) {
    const result = await this.service.create(companyId, dto);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar modelos de lançamento' })
  async findAll(@TenantId() companyId: string) {
    const result = await this.service.findAll(companyId);
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar modelo de lançamento por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.service.findOne(companyId, id);
    return { data: result };
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Executar modelo (criar lançamento a partir do modelo)' })
  async execute(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { periodId: string; date: string; description?: string },
  ) {
    const result = await this.service.execute(companyId, id, body, userId);
    return { data: result };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar modelo de lançamento' })
  async delete(@TenantId() companyId: string, @Param('id') id: string) {
    await this.service.delete(companyId, id);
  }
}
