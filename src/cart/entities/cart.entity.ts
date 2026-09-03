import { Entity, OneToMany, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

// Un carrito por usuario. Se persiste en BD (no en memoria del navegador)
// para cumplir el requerimiento: "el carrito debe persistir la sesion
// del usuario mientras navega por el sitio" (incluso si cierra el navegador
// y vuelve a entrar logueado desde otro dispositivo).
@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true, eager: true })
  items!: CartItem[];
}
