import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HolidayScope {
  NATIONAL = 'NATIONAL',
  STATE = 'STATE',
  MUNICIPAL = 'MUNICIPAL',
}

export class CreateHolidayDto {
  @ApiProperty({ example: '2026-12-25' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Natal' })
  @IsString()
  @MaxLength(200)
  description: string;

  @ApiProperty({ enum: HolidayScope })
  @IsEnum(HolidayScope)
  scope: HolidayScope;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ example: '3550308' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  municipalityCode?: string;
}
