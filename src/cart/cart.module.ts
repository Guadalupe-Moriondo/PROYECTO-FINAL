import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProductsModule, AuthModule],
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService,CartRepository],
})
export class CartModule {}
