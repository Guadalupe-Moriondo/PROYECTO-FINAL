import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderDetail } from './order-detail.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PREPARATION = 'in_preparation',
  WITHDRAW = 'withdraw',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
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
    name: 'delivered_at',
    type: 'timestamp',
    nullable: true,
  })
  deliveredAt!: Date | null;

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

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'cancel_reason', type: 'varchar', length: 255, nullable: true })
  cancelReason!: string | null;

  @Column({ name: 'cancelled_by', type: 'varchar', length: 20, nullable: true })
  cancelledBy!: 'customer' | 'admin' | null;
  }
