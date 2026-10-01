import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductFilterDto } from './dto/product-filter.dto';

@Injectable()
export class ProductsRepository extends Repository<Product> {
  constructor(dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  async searchWithFilters(filters: ProductFilterDto): Promise<[Product[], number]> {
    const query = this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.active = :active', { active: true });

      if (filters.name) {
        const search = filters.name
          .trim()
          .toLowerCase()
          .replace(/s$/, '');

        query.andWhere(
        `(
          LOWER(product.name) LIKE :search
          OR LOWER(product.code) LIKE :search
          OR LOWER(product.description) LIKE :search
          OR LOWER(category.name) LIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (filters.categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.available) {
      query.andWhere('product.stock > 0');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    query
      .orderBy('product.id', 'DESC')
      .skip((page - 1) * limit) 
      .take(limit); 
    return query.getManyAndCount();
  }

  async findAllPaginated(page: number, limit: number): Promise<[Product[], number]> {
    return this.findAndCount({
      where: { active: true },
      relations: {
        category: true
      },
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findWithLowStockPaginated(page: number, limit: number): Promise<[Product[], number]> {
    return this.createQueryBuilder('product')
      .where('product.stock <= product.min_stock')
      .andWhere('product.active = true')
      .orderBy('product.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async adjustStock(productId: number, quantity: number): Promise<void> {
    await this.increment({ id: productId }, 'stock', quantity);
  }
}
