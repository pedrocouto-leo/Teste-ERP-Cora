import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStandardEntryDto {
  @ApiProperty({ example: 'PROV-FOLHA' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Provisao de Folha de Pagamento' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Array de linhas template [{accountId, type, amount?, costCenterId?, description?}]',
    example: [
      { accountId: 'uuid', type: 'DEBIT', amount: 0, description: 'Despesa de pessoal' },
      { accountId: 'uuid', type: 'CREDIT', amount: 0, description: 'Salarios a pagar' },
    ],
  })
  @IsArray()
  lines: Record<string, unknown>[];
}

export class UpdateStandardEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  lines?: Record<string, unknown>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
