import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

export class MovementFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}