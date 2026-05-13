import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsIn,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContractDto {
  @ApiPropertyOptional({ enum: ['FIXED', 'VARIABLE', 'INSTALLMENT', 'INDEFINITE'] })
  @IsOptional()
  @IsString()
  @IsIn(['FIXED', 'VARIABLE', 'INSTALLMENT', 'INDEFINITE'])
  type?: string;

  @ApiPropertyOptional({ example: 'Descricao atualizada' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  totalValue?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  renewalMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  indexerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
