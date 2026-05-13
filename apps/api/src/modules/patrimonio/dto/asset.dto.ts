import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ example: 'PAT-00001' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  assetNumber: string;

  @ApiProperty({ example: 'Computador Dell Latitude 5520' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @ApiProperty({ description: 'ID do grupo de ativos' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  acquisitionDate: string;

  @ApiProperty({ example: 5000.0 })
  @IsNumber()
  @Min(0.01)
  acquisitionValue: number;

  @ApiPropertyOptional({ example: 500.0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  residualValue?: number;

  @ApiPropertyOptional({ description: 'ID do centro de custo' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'ID da filial' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Sala 301 - 3o Andar' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 'SN-ABC123456' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ example: 'NF-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'ID do fornecedor' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

export class UpdateAssetDto extends PartialType(CreateAssetDto) {}

export class WriteOffDto {
  @ApiProperty({ example: 'Ativo danificado sem possibilidade de reparo' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}

export class TransferDto {
  @ApiPropertyOptional({ description: 'ID do centro de custo destino' })
  @IsOptional()
  @IsUUID()
  toCostCenter?: string;

  @ApiPropertyOptional({ description: 'ID da filial destino' })
  @IsOptional()
  @IsUUID()
  toBranch?: string;

  @ApiPropertyOptional({ example: 'Transferência por reorganização de departamentos' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
