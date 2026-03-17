import { IsString, IsOptional, IsIn, IsNumber, IsDateString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCashMovementDto {
  @ApiProperty({ description: 'ID da conta caixa/banco' })
  @IsString()
  cashAccountId: string;

  @ApiProperty({ example: '2026-03-13' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: ['CREDIT', 'DEBIT'], example: 'CREDIT' })
  @IsString()
  @IsIn(['CREDIT', 'DEBIT'])
  type: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(0.0001)
  amount: number;

  @ApiProperty({ example: 'Recebimento de cliente X' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    enum: ['MANUAL', 'AP_PAYMENT', 'AR_RECEIPT', 'TRANSFER', 'CNAB'],
    example: 'MANUAL',
  })
  @IsString()
  @IsIn(['MANUAL', 'AP_PAYMENT', 'AR_RECEIPT', 'TRANSFER', 'CNAB'])
  category: string;

  @ApiPropertyOptional({ description: 'ID do centro de custo' })
  @IsOptional()
  @IsString()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'ID do projeto' })
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class TransferDto {
  @ApiProperty({ description: 'ID da conta de origem' })
  @IsString()
  fromAccountId: string;

  @ApiProperty({ description: 'ID da conta de destino' })
  @IsString()
  toAccountId: string;

  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  @Min(0.0001)
  amount: number;

  @ApiProperty({ example: '2026-03-13' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Transferencia entre contas' })
  @IsString()
  @MaxLength(500)
  description: string;
}
