import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ description: 'ID do plano de contas' })
  @IsString()
  chartId: string;

  @ApiPropertyOptional({ description: 'ID da conta pai' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ example: '1.1.1.01.001', description: 'Codigo da conta (ate 15 digitos)' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Caixa e Equivalentes de Caixa' })
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  name: string;

  @ApiProperty({ example: 1, description: 'Nivel hierarquico (1-9)' })
  @IsInt()
  @Min(1)
  @Max(9)
  level: number;

  @ApiProperty({ enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] })
  @IsString()
  @IsIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
  type: string;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'] })
  @IsString()
  @IsIn(['DEBIT', 'CREDIT'])
  nature: string;

  @ApiPropertyOptional({ example: '1.1.1.00.00-6', description: 'Codigo COSIF' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cosifCode?: string;

  @ApiProperty({ description: 'Permite lancamento (somente contas analiticas)' })
  @IsBoolean()
  allowsPosting: boolean;
}

export class UpdateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cosifCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowsPosting?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
