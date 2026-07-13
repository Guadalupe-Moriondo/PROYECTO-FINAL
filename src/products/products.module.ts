import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { StockController } from './stock/stock.controller';
import { StockService } from './stock/stock.service';
import { StockRepository } from './stock/stock.repository';
import { CategoriesModule } from '../categories/categories.module';
import { AuthModule } from '../auth/auth.module';

// Nota: el modulo de "stock" (movimientos de entrada/salida) se fusiono
// aca adentro porque conceptualmente es parte del dominio de productos:
// no tiene sentido como un modulo de negocio independiente, es apenas
// una forma mas de modificar el inventario de un producto ya existente.
@Module({
  imports: [CategoriesModule, AuthModule], // AuthModule: los guards de stock.controller lo necesitan
  controllers: [ProductsController, StockController],
  providers: [ProductsService, ProductsRepository, StockService, StockRepository],
  exports: [ProductsRepository],
})
export class ProductsModule {}
