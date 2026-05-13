import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateInvoiceItemDto {
  @ApiPropertyOptional({ description: 'Descricao do item/servico' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Codigo do servico municipal' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  serviceCode?: string;

  @ApiPropertyOptional({ description: 'Quantidade' })
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Preco unitario' })
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  unitPrice?: number;
}

export class UpdateInvoiceTaxDto {
  @ApiPropertyOptional({
    description: 'Tipo do imposto',
    enum: ['ISS', 'IR', 'CSLL', 'PIS', 'COFINS', 'INSS'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ISS', 'IR', 'CSLL', 'PIS', 'COFINS', 'INSS'])
  taxType?: string;

  @ApiPropertyOptional({ description: 'Base de calculo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseAmount?: number;

  @ApiPropertyOptional({ description: 'Aliquota (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @ApiPropertyOptional({ description: 'Imposto retido na fonte' })
  @IsOptional()
  @IsBoolean()
  withheld?: boolean;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Descricao da fatura' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Codigo da moeda' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'ID do centro de custo' })
  @IsOptional()
  @IsString()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'ID do projeto' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Itens da fatura', type: [UpdateInvoiceItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInvoiceItemDto)
  items?: UpdateInvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Impostos da fatura', type: [UpdateInvoiceTaxDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInvoiceTaxDto)
  taxes?: UpdateInvoiceTaxDto[];
}
