import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// DTO reutilizable: cualquier endpoint que liste muchos registros
// (productos, pedidos, y en el futuro cualquier otra lista larga)
// puede extender este DTO en vez de repetir los mismos dos campos.
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number) // los query params siempre llegan como string
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // techo de seguridad: nadie puede pedir 1 millon de registros de golpe
  limit?: number = 10;
}

// Forma estandar en la que devolvemos CUALQUIER listado paginado de la API.
// Tenerla centralizada evita que cada modulo invente su propio formato
// de respuesta (uno con "items", otro con "data", otro con "results"...).
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
