import { IsInt, Min } from 'class-validator';

export class AddItemDto {
  @IsInt({ message: 'El producto no es válido.' })
  productId!: number;

  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser al menos 1.' })
  quantity!: number;
}
