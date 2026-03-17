import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateEfdReinfDto {
  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2020)
  year: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({ description: 'Tipo de evento: R-1000, R-2010, R-2020, R-4010, R-4020, R-9000' })
  @IsOptional()
  @IsString()
  eventType?: string;
}

export class TransmitEfdReinfDto {
  @ApiProperty()
  @IsString()
  eventId: string;

  @ApiPropertyOptional({ description: 'Certificado digital A1 em base64' })
  @IsOptional()
  @IsString()
  certificateBase64?: string;
}
