import { IsString, IsOptional, IsIn, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCashAccountDto {
  @ApiProperty({ example: 'Caixa Principal' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: ['CASH', 'BANK', 'INVESTMENT'], example: 'BANK' })
  @IsString()
  @IsIn(['CASH', 'BANK', 'INVESTMENT'])
  type: string;

  @ApiPropertyOptional({ description: 'ID da conta bancaria propria (OwnBankAccount)' })
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'ID da filial' })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateCashAccountDto {
  @ApiPropertyOptional({ example: 'Caixa Atualizado' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: ['CASH', 'BANK', 'INVESTMENT'] })
  @IsOptional()
  @IsString()
  @IsIn(['CASH', 'BANK', 'INVESTMENT'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
