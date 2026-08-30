import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Esta tabla va a tener SIEMPRE una sola fila: los datos generales del negocio.
// No necesita relacionarse con nada, es basicamente configuracion editable
// desde el panel de administracion.
@Entity('business')
export class Business {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  name!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ nullable: true })
  province!: string;

  @Column({ nullable: true })
  country!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  whatsapp!: string; // usado por el boton de consulta directa (objetivo especifico)

  @Column({ nullable: true })
  morningOpen!: string;

  @Column({ nullable: true })
  morningClose!: string;

  @Column({ nullable: true })
  afternoonOpen!: string;

  @Column({ nullable: true })
  afternoonClose!: string;

  @Column({ nullable: true })
  saturdayOpen!: string;

  @Column({ nullable: true })
  saturdayClose!: string;

  @Column({ nullable: true })
  instagram!: string;

  @Column({ nullable: true })
  facebook!: string;

  @Column({ nullable: true })
  email!: string;
}
