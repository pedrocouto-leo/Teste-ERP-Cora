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
  ArrayMinSize,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
  @ApiProperty({ description: 'Descricao do item/servico' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ description: 'Codigo do servico municipal' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  serviceCode?: string;

  @ApiProperty({ description: 'Quantidade', example: 1 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ description: 'Preco unitario', example: 1500.0 })
  @IsNumber()
  @Min(0.0001)
  unitPrice: number;
}

export class CreateInvoiceTaxDto {
  @ApiProperty({
    description: 'Tipo do imposto',
    enum: ['ISS', 'IR', 'CSLL', 'PIS', 'COFINS', 'INSS'],
  })
  @IsString()
  @IsIn(['ISS', 'IR', 'CSLL', 'PIS', 'COFINS', 'INSS'])
  taxType: string;

  @ApiProperty({ description: 'Base de calculo', example: 1500.0 })
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @ApiProperty({ description: 'Aliquota (%)', example: 5.0 })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({ description: 'Imposto retido na fonte', default: false })
  @IsOptional()
  @IsBoolean()
  withheld?: boolean;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'Data de emissao', example: '2024-01-15' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ description: 'Data de vencimento', example: '2024-02-15' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Descricao da fatura' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Codigo da moeda', default: 'BRL' })
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

  @ApiProperty({ description: 'Itens da fatura', type: [CreateInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Impostos da fatura', type: [CreateInvoiceTaxDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceTaxDto)
  taxes?: CreateInvoiceTaxDto[];
}
