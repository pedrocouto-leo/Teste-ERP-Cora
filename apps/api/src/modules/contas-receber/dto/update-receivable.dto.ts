import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReceivableDto {
  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Descricao do titulo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Numero da nota fiscal' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nfNumber?: string;

  @ApiPropertyOptional({
    description: 'Status do titulo',
    enum: ['OPEN', 'CANCELLED'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['OPEN', 'CANCELLED'])
  status?: string;
}
