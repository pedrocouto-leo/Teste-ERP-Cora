import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveSettlementDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsString()
  action: 'approve' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comments?: string;
}
