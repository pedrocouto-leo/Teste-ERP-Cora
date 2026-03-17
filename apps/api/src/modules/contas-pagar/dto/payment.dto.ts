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

export class ProcessPaymentDto {
  @ApiProperty({ enum: ['BOLETO', 'TED', 'PIX', 'CHEQUE', 'DDA', 'CNAB'] })
  @IsString()
  @MaxLength(20)
  paymentMethod: string;

  @ApiProperty({ example: '2026-03-13' })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;
}
