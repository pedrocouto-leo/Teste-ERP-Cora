import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettlementDto {
  @ApiProperty({ enum: ['PAYMENT', 'RECEIPT', 'TRANSFER'] })
  @IsString()
  @MaxLength(20)
  type: string;

  @ApiProperty({ example: 'contas-pagar', enum: ['contas-pagar', 'contas-receber', 'caixa-bancos'] })
  @IsString()
  @MaxLength(30)
  sourceModule: string;

  @ApiPropertyOptional({ description: 'ID do documento de origem' })
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiProperty({ example: 15000.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-03-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Pagamento NF-001 Fornecedor ABC' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'ID da conta bancária' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;
}
