import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StockMovement, MovementType } from '../entities/stock-movement.entity';

@Injectable()
export class StockRepository extends Repository<StockMovement> {
  constructor(dataSource: DataSource) {
    super(StockMovement, dataSource.createEntityManager());
  }

  findByProduct(productId: number): Promise<StockMovement[]> {
    return this.find({
      where: { product: { id: productId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
  ): Promise<[StockMovement[], number]> {
    const query = this.createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoin('movement.user', 'mUser')
      .addSelect(['mUser.id', 'mUser.name'])
      .leftJoin('movement.order', 'mOrder')
      .addSelect(['mOrder.id', 'mOrder.orderNumber'])
      .orderBy('movement.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const term = search?.trim().toLowerCase();

    if (term) {
      query.where(
        `(
          LOWER(product.name) LIKE :search
          OR LOWER(product.code) LIKE :search
          OR LOWER(movement.reason) LIKE :search
          OR DATE_FORMAT(movement.createdAt, '%d/%m/%Y') LIKE :search
          OR (movement.type = :inType AND 'entrada' LIKE :search)
          OR (movement.type = :outType AND 'salida' LIKE :search)
          OR LOWER(mUser.name) LIKE :search
          OR LOWER(mOrder.orderNumber) LIKE :search

        )`,
        {
          search: `%${term}%`,
          inType: MovementType.IN,
          outType: MovementType.OUT,
        },
      );
    }
    
    return query.getManyAndCount();
  }
}
