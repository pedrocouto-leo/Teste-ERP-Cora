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
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/holiday.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Holidays')
@Controller('cadastro/holidays')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar feriado' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateHolidayDto,
  ) {
    const result = await this.holidayService.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar feriados' })
  async findAll(
    @TenantId() companyId: string,
    @Query('year') year?: string,
    @Query('scope') scope?: string,
    @Query('state') state?: string,
  ) {
    const result = await this.holidayService.findAll(
      companyId,
      year ? parseInt(year, 10) : undefined,
      scope,
      state,
    );
    return { data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar feriado por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.holidayService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar feriado' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: Partial<CreateHolidayDto>,
  ) {
    const result = await this.holidayService.update(
      companyId,
      id,
      dto,
      userId,
    );
    return { data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover feriado' })
  async remove(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.holidayService.remove(companyId, id);
    return { data: result };
  }
}
