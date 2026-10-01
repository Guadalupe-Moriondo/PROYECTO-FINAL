import { Column, Entity, OneToMany, PrimaryGeneratedColumn, VirtualColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
 
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];

  @VirtualColumn({
    query: (alias) => `SELECT COUNT(*) FROM products WHERE products.category_id = ${alias}.id AND products.active = true`,
  })
  productCount!: number;
}
