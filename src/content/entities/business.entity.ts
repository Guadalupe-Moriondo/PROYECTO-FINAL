import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
  whatsapp!: string; 

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
