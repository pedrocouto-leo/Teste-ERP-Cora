import { IsString, IsOptional, IsIn, IsDateString, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ImportStatementLineDto {
  @ApiProperty({ example: '2026-03-10' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 1500.00 })
  amount: number;

  @ApiProperty({ enum: ['CREDIT', 'DEBIT'] })
  @IsString()
  @IsIn(['CREDIT', 'DEBIT'])
  type: string;

  @ApiProperty({ example: 'Pagamento ref NF 1234' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ example: '001234' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentNumber?: string;
}

export class ImportStatementDto {
  @ApiProperty({ description: 'ID da conta caixa/banco' })
  @IsString()
  cashAccountId: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-03-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 10000.00 })
  openingBalance: number;

  @ApiProperty({ example: 12500.00 })
  closingBalance: number;

  @ApiProperty({ enum: ['CNAB240', 'OFX', 'CSV'], example: 'CNAB240' })
  @IsString()
  @IsIn(['CNAB240', 'OFX', 'CSV'])
  format: string;

  @ApiPropertyOptional({ example: 'extrato_mar2026.ret' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ description: 'Conteudo bruto do arquivo CNAB 240 (se formato CNAB240)' })
  @IsOptional()
  @IsString()
  rawContent?: string;

  @ApiPropertyOptional({ description: 'Linhas do extrato (se nao for CNAB240 ou parsing manual)', type: [ImportStatementLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportStatementLineDto)
  lines?: ImportStatementLineDto[];
}

export class ReconcileDto {
  @ApiProperty({ description: 'ID da linha do extrato' })
  @IsString()
  statementLineId: string;

  @ApiProperty({ description: 'ID do movimento caixa/banco correspondente' })
  @IsString()
  movementId: string;
}
