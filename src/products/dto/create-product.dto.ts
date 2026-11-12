import {IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio.' })
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  machineryCompatibility?: string;

  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @IsPositive({ message: 'El precio debe ser mayor a 0.' })
  price!: number;

  @IsInt({ message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  @IsOptional()
  stock?: number;

  @IsInt({ message: 'El stock mínimo debe ser un número entero.' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo.' })
  @IsOptional()
  minStock?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsInt({ message: 'Debés seleccionar una categoría.' })
  categoryId!: number;
}
