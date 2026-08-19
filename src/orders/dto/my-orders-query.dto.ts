import { IsOptional, IsIn } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

export class MyOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['pending', 'delivered'])
  status?: 'pending' | 'delivered';
}