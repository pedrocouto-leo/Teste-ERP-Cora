import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  IsIn,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ContractInstallmentDto {
  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class CreateContractDto {
  @ApiProperty({ example: 'CTR-001' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  contractNumber: string;

  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiProperty({ enum: ['FIXED', 'VARIABLE', 'INSTALLMENT', 'INDEFINITE'] })
  @IsString()
  @IsIn(['FIXED', 'VARIABLE', 'INSTALLMENT', 'INDEFINITE'])
  type: string;

  @ApiProperty({ example: 'Contrato de prestacao de servicos' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 120000 })
  @IsNumber()
  @Min(0.01)
  totalValue: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  renewalMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  indexerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ type: [ContractInstallmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractInstallmentDto)
  installments?: ContractInstallmentDto[];
}
