import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReceivableDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'Numero do titulo', example: 'NF-001' })
  @IsString()
  @MaxLength(50)
  titleNumber: string;

  @ApiPropertyOptional({ description: 'Numero da parcela', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  installment?: number;

  @ApiProperty({ description: 'Data de emissao', example: '2024-01-15' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ description: 'Data de vencimento', example: '2024-02-15' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Valor original', example: 1500.0 })
  @IsNumber()
  @Min(0.01)
  originalAmount: number;

  @ApiPropertyOptional({ description: 'Codigo da moeda', default: 'BRL' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Descricao do titulo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Numero da nota fiscal' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nfNumber?: string;
}
