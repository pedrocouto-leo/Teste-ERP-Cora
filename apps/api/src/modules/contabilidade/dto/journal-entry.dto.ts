import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  IsArray,
  ValidateNested,
  IsNumber,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JournalEntryLineDto {
  @ApiProperty({ description: 'ID da conta contabil' })
  @IsString()
  accountId: string;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'] })
  @IsString()
  @IsIn(['DEBIT', 'CREDIT'])
  type: string;

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'ID do centro de custo' })
  @IsOptional()
  @IsString()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'ID do projeto' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Lancamento de provisao mensal' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ enum: ['MANUAL', 'AUTO', 'TEMPLATE'], default: 'MANUAL' })
  @IsOptional()
  @IsString()
  @IsIn(['MANUAL', 'AUTO', 'TEMPLATE'])
  type?: string;

  @ApiProperty({ type: [JournalEntryLineDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}

export class ApproveEntryDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  action: string;
}
