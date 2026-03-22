import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsIn } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class DdrFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Data início (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data fim (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Status do relatório',
    enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUBMITTED', 'REJECTED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUBMITTED', 'REJECTED'])
  status?: string;
}
