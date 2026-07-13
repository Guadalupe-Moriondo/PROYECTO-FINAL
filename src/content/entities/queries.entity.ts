import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

export enum QueryType {
  GENERAL_QUERY = 'general_query',
  QUOTE = 'quote',
}

export enum QueryStatus {
  PENDING = 'pending',
  ANSWERED = 'answered',
}

// Registra cada mensaje que un visitante envia desde el "boton de contacto"
// del sitio (requerimiento funcional 11). No requiere que el cliente este
// registrado ni logueado: cualquiera puede consultar o pedir presupuesto.
@Entity('queries')
export class Query {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  name!: string;

  @Column({ length: 150 })
  email!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ type: 'enum', enum: QueryType, default: QueryType.GENERAL_QUERY })
  type!: QueryType;

  @Column({ type: 'text' })
  message!: string;

  // Opcional: si la consulta es un presupuesto sobre un producto puntual
  // (ej: el cliente la envia desde la pagina de detalle de un repuesto)
  @ManyToOne(() => Product, { nullable: true, eager: true })
  @JoinColumn({ name: 'product_id' })
  product!: Product | null;

  @Column({ type: 'enum', enum: QueryStatus, default: QueryStatus.PENDING })
  status!: QueryStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}