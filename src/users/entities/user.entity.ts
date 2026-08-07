import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Enum para el rol. Cubre el requerimiento de login diferenciado
// para clientes y para el panel de administracion.
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

  // Nunca se guarda la contraseña en texto plano: siempre el hash de bcrypt
  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({
    default: false,
  })
  owner!: boolean;

  @Column({ nullable: true })
  phone!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
