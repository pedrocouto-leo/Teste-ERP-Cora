import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateEfdContribuicoesDto {
  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2020)
  year: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}
