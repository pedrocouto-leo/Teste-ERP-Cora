import { IsString, IsOptional, IsNumber, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReallocationDto {
  @ApiProperty({ description: 'ID da linha de origem' })
  @IsUUID()
  fromLineId: string;

  @ApiProperty({ description: 'ID da linha de destino' })
  @IsUUID()
  toLineId: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0.0001)
  amount: number;

  @ApiProperty({ example: 3, description: 'Mês (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 'Remanejamento para cobrir despesas emergenciais' })
  @IsString()
  reason: string;
}

export class ApproveReallocationDto {
  @ApiProperty({ enum: ['approve', 'reject'] })
  @IsString()
  action: 'approve' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}
