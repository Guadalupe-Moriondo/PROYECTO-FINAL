import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Business } from './entities/business.entity';

@Injectable()
export class BusinessRepository extends Repository<Business> {
  constructor(dataSource: DataSource) {
    super(Business, dataSource.createEntityManager());
  }

  async getOnly(): Promise<Business | null> {
    const [business] = await this.find({ take: 1 });
    return business || null;
  }
}
