import { IsOptional, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';
 
// Extiende la paginacion comun y le suma el filtro opcional por mes que
// usa el Historial de pedidos. Al tener "whitelist + forbidNonWhitelisted"
// activado globalmente, CUALQUIER query param que llegue tiene que estar
// declarado en el DTO que se esta validando, o Nest rechaza la request
// entera (400) antes de llegar al controller. Por eso "month" no puede
// viajar suelto: tiene que vivir en este mismo DTO junto a page/limit.
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
 