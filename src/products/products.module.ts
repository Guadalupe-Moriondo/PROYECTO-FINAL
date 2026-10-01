import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { StockController } from './stock/stock.controller';
import { StockService } from './stock/stock.service';
import { StockRepository } from './stock/stock.repository';
import { CategoriesModule } from '../categories/categories.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CategoriesModule, AuthModule], 
  controllers: [ProductsController, StockController],
  providers: [ProductsService, ProductsRepository, StockService, StockRepository],
  exports: [ProductsRepository],
})
export class ProductsModule {}
