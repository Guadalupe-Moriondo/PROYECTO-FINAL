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
  phone!: string;

  @Column({ nullable: true })
  whatsapp!: string; // usado por el boton de consulta directa (objetivo especifico)

  @Column({ type: 'text', nullable: true })
  hours!: string;

  @Column({ nullable: true })
  instagram!: string;

  @Column({ nullable: true })
  facebook!: string;
}
