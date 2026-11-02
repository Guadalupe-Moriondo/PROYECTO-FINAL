import { Injectable, NotFoundException } from '@nestjs/common';
import { StockRepository } from './stock.repository';
import { ProductsRepository } from '../products.repository';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { MovementType } from '../entities/stock-movement.entity';
import { BadRequestException} from '@nestjs/common';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination';
import { MovementFilterDto } from '../dto/movement-filter.dto';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async registerMovement(dto: CreateMovementDto) {
    const product = await this.productsRepository.findOneBy({ id: dto.productId });
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (dto.type === MovementType.OUT && product.stock < dto.quantity) {
    throw new BadRequestException('Stock insuficiente.');
    }
    
    if (dto.type === MovementType.OUT) {
      // Descuento atómico: falla si otro egreso se llevó el stock en el medio
      const done = await this.productsRepository.decrementStockIfAvailable(
        dto.productId,
        dto.quantity,
      );
      if (!done) throw new BadRequestException('Stock insuficiente.');
    } else {
      await this.productsRepository.adjustStock(dto.productId, dto.quantity);
    }
    
    const movement = this.stockRepository.create({
      product,
      type: dto.type,
      quantity: dto.quantity,
      reason: dto.reason,
    });
    return this.stockRepository.save(movement);
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
