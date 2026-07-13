import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

export enum MovementType {
  IN = 'in',
  OUT = 'out',
}

// Registra CADA cambio de stock (requerimiento funcional 14), sirve
// tambien como historial/auditoria de todo lo que paso con cada producto
@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'enum', enum: MovementType })
  type!: MovementType;

  @Column()
  quantity!: number;

  @Column({ nullable: true })
  reason!: string; // ej: "compra a proveedor", "ajuste por inventario", "venta"

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
