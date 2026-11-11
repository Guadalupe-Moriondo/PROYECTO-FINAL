import { Injectable, NotFoundException } from '@nestjs/common';
import { StockRepository } from './stock.repository';
import { ProductsRepository } from '../products.repository';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { MovementType } from '../entities/stock-movement.entity';
import { BadRequestException} from '@nestjs/common';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination';
import { MovementFilterDto } from '../dto/movement-filter.dto';
import { DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { StockMovement } from '../entities/stock-movement.entity';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly dataSource: DataSource,
  ) {}

  async registerMovement(dto: CreateMovementDto, userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: dto.productId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) throw new NotFoundException('Producto no encontrado');

      if (dto.type === MovementType.OUT && product.stock < dto.quantity) {
        throw new BadRequestException('Stock insuficiente.');
      }

      product.stock += dto.type === MovementType.IN ? dto.quantity : -dto.quantity;
      await manager.save(product);

      return manager.save(
        manager.create(StockMovement, {
          product: { id: product.id },
          type: dto.type,
          quantity: dto.quantity,
          reason: dto.reason,
          user: { id: userId },
        }),
      );
    });
  }

  historyByProduct(productId: number) {
    return this.stockRepository.findByProduct(productId);
  }

  async history(filters: MovementFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const [data, total] = await this.stockRepository.findAllPaginated(
      page,
      limit,
      filters.search,
    );

    return buildPaginatedResult(data, total, page, limit);
  }

  async lowStockAlerts(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.productsRepository.findWithLowStockPaginated(page, limit);
    return buildPaginatedResult(data, total, page, limit);
  }
}
