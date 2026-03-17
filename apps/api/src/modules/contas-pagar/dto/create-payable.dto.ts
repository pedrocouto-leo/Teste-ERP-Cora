import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CostAllocationDto {
  @ApiProperty()
  @IsUUID()
  costCenterId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  percentage: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class TaxDto {
  @ApiProperty({ example: 'IR', enum: ['IR', 'CSLL', 'PIS', 'COFINS', 'ISS', 'INSS'] })
  @IsString()
  @MaxLength(20)
  taxType: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  withheld?: boolean;
}

export class CreatePayableDto {
  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiProperty({ example: 'NF-001' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  titleNumber: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  installment?: number;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0.01)
  originalAmount: number;

  @ApiPropertyOptional({ default: 'BRL' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

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

  @ApiProperty({ type: [CostAllocationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CostAllocationDto)
  costAllocations: CostAllocationDto[];

  @ApiPropertyOptional({ type: [TaxDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxDto)
  taxes?: TaxDto[];
}
