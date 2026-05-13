import {
  IsString,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({ example: 'Orçamento Anual 2026' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: 'Orçamento Anual 2026 - Revisado' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;
}

export class ApproveBudgetDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsString()
  action: 'approve' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}

export class ReplicateBudgetDto {
  @ApiProperty({ description: 'Ano de origem para replicar' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  sourceYear: number;

  @ApiPropertyOptional({ description: 'Versão de origem (padrão: última ativa)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  sourceVersion?: number;

  @ApiProperty({ description: 'Nome do novo orçamento' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Ano destino' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  targetYear: number;
}
