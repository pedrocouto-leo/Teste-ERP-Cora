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

export class ReceivingItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantidade recebida' })
  @IsNumber()
  @Min(1)
  quantityReceived: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'ID do item do pedido correspondente' })
  @IsOptional()
  @IsUUID()
  orderItemId?: string;
}

export class CreateReceivingDto {
  @ApiProperty()
  @IsUUID()
  purchaseOrderId: string;

  @ApiProperty()
  @IsDateString()
  receivingDate: string;

  @ApiPropertyOptional({ description: 'Número da NF-e' })
  @IsOptional()
  @IsString()
  nfNumber?: string;

  @ApiPropertyOptional({ description: 'Série da NF-e' })
  @IsOptional()
  @IsString()
  nfSeries?: string;

  @ApiPropertyOptional({ description: 'Chave de acesso NF-e (44 dígitos)' })
  @IsOptional()
  @IsString()
  nfAccessKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ type: [ReceivingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivingItemDto)
  items: ReceivingItemDto[];
}
