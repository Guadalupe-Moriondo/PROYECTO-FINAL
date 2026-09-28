import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

export class OrderFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}