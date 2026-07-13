import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StockMovement } from '../entities/stock-movement.entity';

@Injectable()
export class StockRepository extends Repository<StockMovement> {
  constructor(private dataSource: DataSource) {
    super(StockMovement, dataSource.createEntityManager());
  }

  findByProduct(productId: number): Promise<StockMovement[]> {
    return this.find({
      where: { product: { id: productId } },
      order: { createdAt: 'DESC' },
    });
  }
}
