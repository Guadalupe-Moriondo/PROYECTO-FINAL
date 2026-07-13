import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  // Codigo interno del repuesto, para busqueda rapida (requerimiento funcional 4)
  @Column({ unique: true, length: 50 })
  code!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  // Descripcion tecnica y compatibilidad de maquinaria (objetivo especifico)
  @Column({ type: 'text', nullable: true })
  machineryCompatibility!: string;

  @Column({ length: 100, nullable: true })
  brand!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ default: 0 })
  stock!: number;

  // Notificacion visual de stock minimo (requerimiento del alcance)
  @Column({ name: 'min_stock', default: 5 })
  minStock!: number;

  @Column({ nullable: true })
  imageUrl!: string;

  @Column({ default: true })
  active!: boolean; // permite "eliminar" logicamente sin borrar el historial de pedidos

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relacion muchos a uno: muchos productos pertenecen a una categoria
  @ManyToOne(() => Category, (category) => category.products, { eager: false })
  @JoinColumn({ name: 'category_id' })
  category!: Category;
}
