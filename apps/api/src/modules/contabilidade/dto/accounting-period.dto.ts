import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountingPeriodDto {
  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 1, description: 'Mes (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

export class ClosePeriodDto {
  // No additional fields needed; the period ID comes from the route param
  // and the user ID comes from the JWT token
}
