import { Injectable, NotFoundException } from '@nestjs/common';
import { StockRepository } from './stock.repository';
import { ProductsRepository } from '../products.repository';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { MovementType } from '../entities/stock-movement.entity';
import { BadRequestException} from '@nestjs/common';
import { buildPaginatedResult, PaginationQueryDto } from '../../common/pagination';


@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async registerMovement(dto: CreateMovementDto) {
    const product = await this.productsRepository.findOneBy({ id: dto.productId });
    if (!product) throw new NotFoundException('Producto no encontrado');

    // Si es una salida, verificamos que haya stock suficiente
    if (dto.type === MovementType.OUT && product.stock < dto.quantity) {
    throw new BadRequestException('Stock insuficiente.');
  }

    // La entrada suma stock, la salida resta
    const delta = dto.type === MovementType.IN ? dto.quantity : -dto.quantity;
    await this.productsRepository.adjustStock(dto.productId, delta);

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

  async lowStockAlerts(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.productsRepository.findWithLowStockPaginated(page, limit);
    return buildPaginatedResult(data, total, page, limit);
  }
}
