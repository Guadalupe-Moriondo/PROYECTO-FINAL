import { Injectable, NotFoundException } from '@nestjs/common';
import { StockRepository } from './stock.repository';
import { ProductsRepository } from '../products.repository';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { MovementType } from '../entities/stock-movement.entity';
import { BadRequestException} from '@nestjs/common';
@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async registerMovement(dto: CreateMovementDto) {
    const product = await this.productsRepository.findOneBy({ id: dto.productId });
    if (!product) throw new NotFoundException('Product not found');

    // Si es una salida, verificamos que haya stock suficiente
    if (dto.type === MovementType.OUT && product.stock < dto.quantity) {
    throw new BadRequestException('Insufficient stock');
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

  lowStockAlerts() {
    return this.productsRepository.findWithLowStock();
  }
}
