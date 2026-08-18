import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';

// Este DTO representa los QUERY PARAMS que llegan por la URL, ej:
// GET /productos?nombre=filtro&categoriaId=2&precioMin=1000&disponible=true&pagina=2&limite=20
// Cubre el requerimiento: "buscador con filtros por categoria, marca, precio y disponibilidad"
// La categoria representa la marca del producto.
// Extiende PaginacionQueryDto para sumar "pagina" y "limite" sin repetirlos aca.
export class ProductFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  name?: string; // busca por nombre O codigo (lo resolvemos en el repository)

  @IsOptional()
  @Type(() => Number) // los query params siempre llegan como string, hay que convertirlos
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
  @Type(() => Boolean)
  @IsBoolean()
  available?: boolean; // true = solo productos con stock > 0
}
