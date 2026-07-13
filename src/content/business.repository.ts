import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Business } from './entities/business.entity';

@Injectable()
export class BusinessRepository extends Repository<Business> {
  constructor(private dataSource: DataSource) {
    super(Business, dataSource.createEntityManager());
  }

  // Como solo hay una fila, este metodo simplifica traerla sin manejar arrays
  async getOnly(): Promise<Business | null> {
    const [business] = await this.find({ take: 1 });
    return business || null;
  }
}
