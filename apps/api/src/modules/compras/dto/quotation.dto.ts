import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuotationItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount?: number;
}

export class CreateQuotationDto {
  @ApiProperty()
  @IsUUID()
  purchaseRequestId: string;

  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryDays?: number;

  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];
}

export class SelectQuotationDto {
  @ApiProperty()
  @IsString()
  action: 'select' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}
