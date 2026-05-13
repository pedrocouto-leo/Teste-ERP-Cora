import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateDdrReportDto {
  @ApiProperty({ description: 'Data-base do relatório (YYYY-MM-DD)' })
  @IsDateString()
  referenceDate: string;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}
