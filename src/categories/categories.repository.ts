import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesRepository extends Repository<Category> {
  constructor(dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  findAllPaginated(page: number, limit: number) {
    return this.findAndCount({
      where: { active: true },
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
