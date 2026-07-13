import { IsEnum } from 'class-validator';
import { PaymentMethod } from '../entities/order.entity';

// El pedido se arma a partir del carrito actual del usuario logueado,
// por eso el unico dato que pedimos aca es el metodo de pago elegido
// (requerimiento funcional 8)
export class CreateOrderDto {
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
