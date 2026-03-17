import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReceivePaymentDto {
  @ApiProperty({ description: 'Valor recebido', example: 500.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Data do recebimento', example: '2024-02-15' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ description: 'ID da conta bancaria de recebimento' })
  @IsOptional()
  @IsString()
  bankAccountId?: string;
}
