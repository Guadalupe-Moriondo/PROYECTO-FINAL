import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { MovementType } from '../entities/stock-movement.entity';

export class CreateMovementDto {
  @IsInt()
  productId!: number;

  @IsEnum(MovementType,{message: 'El tipo de movimiento debe ser "Entrada" o "Salida"'} )
  type!: MovementType;

  @IsInt({message: 'La cantidad debe ser un número entero'})
  @IsPositive({message: 'La cantidad debe ser mayor a 0'})
  quantity!: number;

  @IsString({message: 'El motivo debe ser un texto'})
  @IsOptional()
  reason?: string;
}
