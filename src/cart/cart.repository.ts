import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartRepository extends Repository<Cart> {
  constructor(private dataSource: DataSource) {
    super(Cart, dataSource.createEntityManager());
  }

  // Trae (o indica que no existe) el carrito de un usuario, con sus items
  // y el producto de cada item ya cargado (gracias a eager:true en las relaciones)
  findByUserId(userId: number): Promise<Cart | null> {
    return this.findOne({ where: { user: { id: userId } } });
  }
}
