import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { MovementType } from '../entities/stock-movement.entity';

export class CreateMovementDto {
  @IsInt()
  productId!: number;

  @IsEnum(MovementType)
  type!: MovementType;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
