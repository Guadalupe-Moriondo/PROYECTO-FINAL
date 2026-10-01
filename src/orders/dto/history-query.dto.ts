import { IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

export class OrderHistoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month?: string;

  @IsOptional()
  @Matches(/^\d{4}$/, {
    message: 'year must be a 4-digit year (YYYY)',
  })
  year?: string;
}
 