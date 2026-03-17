import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddendumDto {
  @ApiProperty({ example: 'Aditivo de reajuste de valor' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  valueChange?: number;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsDateString()
  newEndDate?: string;
}
