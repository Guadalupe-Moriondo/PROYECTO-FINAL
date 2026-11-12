import { IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

export class OrderHistoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'El mes debe tener el formato AAAA-MM.',
  })
  month?: string;

  @IsOptional()
  @Matches(/^\d{4}$/, {
    message: 'El año debe ser un año de 4 dígitos (AAAA)',
  })
  year?: string;
}
 