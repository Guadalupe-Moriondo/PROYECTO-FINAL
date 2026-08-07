import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderDetail } from './order-detail.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PREPARATION = 'in_preparation',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
}

export enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  CARD = 'card',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  // Numero de orden legible para el cliente (distinto del id interno)
  @Column({ name: 'order_number', unique: true })
  orderNumber!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ type: 'enum', enum: PaymentMethod, name: 'payment_method' })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @OneToMany(() => OrderDetail, (detail) => detail.order, { cascade: true, eager: true })
  details!: OrderDetail[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({
    default: false,
  })
  customerNotified!: boolean;

  @Column({
    nullable: true,
  })
  notificationMethod!: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  customerNotifiedAt!: Date | null;
  }
