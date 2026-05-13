import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  Length,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';

export class CreateDdrEntryDto {
  @ApiProperty({ description: 'Código da conta DDR (ex: 111000)', example: '111000' })
  @IsString()
  @Length(6, 6)
  accountCode: string;

  @ApiPropertyOptional({ description: 'Código moeda BCB - Elemento 83 (ex: 220=USD)', example: '220' })
  @IsOptional()
  @IsString()
  @Length(1, 3)
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Código país ISO - Elemento 81 (ex: BR, US)', example: 'US' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Posição - Elemento 84: 1=País, 2=Exterior', enum: [1, 2] })
  @IsOptional()
  @IsIn([1, 2])
  positionType?: number;

  @ApiProperty({ description: 'Valor em Reais (2 casas decimais)', example: 1500000.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  value: number;
}

export class BatchDdrEntryDto {
  entries: CreateDdrEntryDto[];
}
