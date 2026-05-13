import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateBoletoDto {
  @ApiProperty({ description: 'ID do titulo a receber' })
  @IsString()
  receivableId: string;

  @ApiProperty({ description: 'ID da conta bancaria' })
  @IsString()
  bankAccountId: string;

  @ApiPropertyOptional({ description: 'Data de vencimento do boleto' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Valor do boleto' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}

export class UpdateBoletoStatusDto {
  @ApiProperty({
    description: 'Status do boleto',
    enum: ['GENERATED', 'SENT', 'PAID', 'CANCELLED', 'PROTESTED'],
  })
  @IsString()
  @IsIn(['GENERATED', 'SENT', 'PAID', 'CANCELLED', 'PROTESTED'])
  status: string;

  @ApiPropertyOptional({ description: 'Valor pago' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Data do pagamento' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
