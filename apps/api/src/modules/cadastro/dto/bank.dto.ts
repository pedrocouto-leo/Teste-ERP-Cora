import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankDto {
  @ApiProperty({ example: '001' })
  @IsString()
  @MinLength(3)
  @MaxLength(5)
  code: string;

  @ApiProperty({ example: 'Banco do Brasil' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ispb?: string;
}

export class CreateBankAgencyDto {
  @ApiProperty({ example: '0001' })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  code: string;

  @ApiProperty({ example: 'Agencia Centro' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  digit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;
}

export enum BankAccountType {
  CC = 'CC',
  CP = 'CP',
}

export class CreateOwnBankAccountDto {
  @ApiProperty({ description: 'ID do banco' })
  @IsString()
  bankId: string;

  @ApiProperty({ description: 'ID da agencia' })
  @IsString()
  agencyId: string;

  @ApiProperty({ example: '12345-6' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  accountNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  digit?: string;

  @ApiProperty({ enum: BankAccountType })
  @IsEnum(BankAccountType)
  accountType: BankAccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
