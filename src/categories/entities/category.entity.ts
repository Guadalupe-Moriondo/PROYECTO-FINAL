import { Column, Entity, OneToMany, PrimaryGeneratedColumn, VirtualColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

// @Entity() le dice a TypeORM que esta clase representa una tabla.
// Por defecto la tabla se llama "categoria" (nombre de la clase en minuscula).
@Entity('categories')
export class Category {
  // Clave primaria autoincremental
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ length: 20, default: 'otros' })
  machineType!: string;

  @Column({ default: true })
  active!: boolean;


  // Relacion 1 a muchos: una categoria tiene muchos productos.
  // El segundo argumento es una funcion que apunta a la propiedad
  // inversa en la otra entidad (producto.categoria)
  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];

  // Reemplaza a `loadRelationCountAndMap`, eliminado en TypeORM 1.0.
  // Se calcula con una sub-consulta cada vez que se trae la entidad
  // a traves de `findWithProductCount()`.
  @VirtualColumn({
    query: (alias) => `SELECT COUNT(*) FROM products WHERE products.category_id = ${alias}.id AND products.active = true`,
  })
  productCount!: number;
}
