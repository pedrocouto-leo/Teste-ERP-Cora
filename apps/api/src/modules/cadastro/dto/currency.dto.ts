import {
  IsString,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USD' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  code: string;

  @ApiProperty({ example: 'Dolar Americano' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '$' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  symbol?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  decimalPlaces?: number;
}

export class CreateExchangeRateDto {
  @ApiProperty({ example: '2026-03-13' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 5.25 })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({ description: 'Taxa de venda' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellRate?: number;
}
