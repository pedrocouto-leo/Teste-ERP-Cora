import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EcfService } from './ecf.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class GenerateEcfDto {
  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(2020)
  year: number;
}

@ApiTags('ECF')
@Controller('informes-fiscais/ecf')
@UseGuards(AuthGuard('jwt'), TenantGuard, RolesGuard)
@ApiBearerAuth()
export class EcfController {
  constructor(private readonly ecfService: EcfService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gerar ECF - Escrituração Contábil Fiscal (IRPJ/CSLL)' })
  async generate(
    @TenantId() companyId: string,
    @Body() dto: GenerateEcfDto,
  ) {
    const result = await this.ecfService.generate(companyId, dto.year);
    return { data: result };
  }
}
