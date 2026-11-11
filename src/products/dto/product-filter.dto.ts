import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString,} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/pagination';

export class ProductFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number) 
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  available?: boolean;
}
