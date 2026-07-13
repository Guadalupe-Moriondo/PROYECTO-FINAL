import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  // Metodo custom usado por el modulo de autenticacion para buscar por email
  findByEmail(email: string): Promise<User | null> {
    return this.findOneBy({ email });
  }
}
