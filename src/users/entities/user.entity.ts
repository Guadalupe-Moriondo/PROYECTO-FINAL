import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  name!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({
    default: false,
  })
  owner!: boolean;

  @Exclude()
  @Column({ default: 0 })
  tokenVersion!: number;

  @Column({ nullable: true })
  phone!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
