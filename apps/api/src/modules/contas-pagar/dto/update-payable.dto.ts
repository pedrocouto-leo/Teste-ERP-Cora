import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CostAllocationDto, TaxDto } from './create-payable.dto';

export class UpdatePayableDto {
  @ApiPropertyOptional({ example: '2026-04-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  originalAmount?: number;

  @ApiPropertyOptional({ enum: ['BOLETO', 'TED', 'PIX', 'CHEQUE', 'DDA', 'CNAB'] })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nfNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  nfSeries?: string;

  @ApiPropertyOptional({ type: [CostAllocationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CostAllocationDto)
  costAllocations?: CostAllocationDto[];

  @ApiPropertyOptional({ type: [TaxDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxDto)
  taxes?: TaxDto[];
}
