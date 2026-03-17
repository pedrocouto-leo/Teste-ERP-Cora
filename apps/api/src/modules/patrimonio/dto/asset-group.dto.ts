import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAssetGroupDto {
  @ApiProperty({ example: 'GRP-001' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Móveis e Utensílios' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 60, description: 'Vida útil em meses' })
  @IsInt()
  @Min(1)
  usefulLife: number;

  @ApiProperty({ example: 10.0, description: 'Taxa de depreciação anual (%)' })
  @IsNumber()
  @Min(0)
  deprecRate: number;

  @ApiPropertyOptional({ description: 'ID da conta contábil do ativo' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'ID da conta contábil de depreciação' })
  @IsOptional()
  @IsUUID()
  depAccountId?: string;
}

export class UpdateAssetGroupDto extends PartialType(CreateAssetGroupDto) {}
