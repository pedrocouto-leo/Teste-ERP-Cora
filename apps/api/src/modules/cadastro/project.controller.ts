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
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Projects')
@Controller('cadastro/projects')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar projeto' })
  async create(
    @TenantId() companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    const result = await this.projectService.create(companyId, dto, userId);
    return { data: result };
  }

  @Get()
  @ApiOperation({ summary: 'Listar projetos' })
  async findAll(
    @TenantId() companyId: string,
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.projectService.findAll(companyId, pagination, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar projeto por ID' })
  async findOne(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.projectService.findOne(companyId, id);
    return { data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar projeto' })
  async update(
    @TenantId() companyId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const result = await this.projectService.update(
      companyId,
      id,
      dto,
      userId,
    );
    return { data: result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover projeto' })
  async remove(@TenantId() companyId: string, @Param('id') id: string) {
    const result = await this.projectService.remove(companyId, id);
    return { data: result };
  }
}
