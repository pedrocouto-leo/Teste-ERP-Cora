import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsInt,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNegotiationDto {
  @ApiProperty({ description: 'ID do titulo a receber' })
  @IsString()
  receivableId: string;

  @ApiProperty({
    description: 'Tipo de negociacao',
    enum: ['DISCOUNT', 'EXTENSION', 'INSTALLMENT', 'WRITE_OFF'],
  })
  @IsString()
  @IsIn(['DISCOUNT', 'EXTENSION', 'INSTALLMENT', 'WRITE_OFF'])
  type: string;

  @ApiProperty({ description: 'Valor negociado', example: 1200.0 })
  @IsNumber()
  @Min(0)
  negotiatedAmount: number;

  @ApiPropertyOptional({ description: 'Valor de desconto', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Nova data de vencimento' })
  @IsOptional()
  @IsDateString()
  newDueDate?: string;

  @ApiPropertyOptional({ description: 'Numero de parcelas', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;

  @ApiPropertyOptional({ description: 'Comentarios' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comments?: string;
}

export class ApproveNegotiationDto {
  @ApiProperty({
    description: 'Acao de aprovacao',
    enum: ['APPROVED', 'REJECTED'],
  })
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  action: string;

  @ApiPropertyOptional({ description: 'Comentarios' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comments?: string;
}
