import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Query, QueryStatus } from './entities/queries.entity';

@Injectable()
export class QueriesRepository extends Repository<Query> {
  constructor(private dataSource: DataSource) {
    super(Query, dataSource.createEntityManager());
  }

  // Metodo custom pensado para el panel de admin: ver primero
  // lo que todavia no fue atendido, ordenado por mas reciente
  findPending(): Promise<Query[]> {
    return this.find({
      where: { status: QueryStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }
}
