import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';

export class CreateDdrParameterDto {
  @ApiProperty({ description: 'Código do parâmetro (ex: FACTOR_F, FACTOR_H)', example: 'FACTOR_F' })
  @IsString()
  @MaxLength(20)
  parameterCode: string;

  @ApiProperty({ description: 'Valor do parâmetro', example: 0.22 })
  @IsNumber({ maxDecimalPlaces: 8 })
  value: number;

  @ApiPropertyOptional({ description: 'Fonte do valor (BCB, MANUAL, CALCULATED)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;
}
