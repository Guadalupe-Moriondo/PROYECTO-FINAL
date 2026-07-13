import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Todo el carrito requiere estar logueado, porque esta atado al usuario
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  view(@Req() req: any) {
    // req.user viene de JwtStrategy.validate() -> { id, email, rol }
    return this.cartService.viewCart(req.user.id);
  }

  @Post('items')
  add(@Req() req: any, @Body() dto: AddItemDto) {
    return this.cartService.addItem(req.user.id, dto);
  }

  @Put('items/:itemId')
  update(
    @Req() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(req.user.id, itemId, quantity);
  }

  @Delete('items/:itemId')
  remove(@Req() req: any, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.cartService.removeItem(req.user.id, itemId);
  }
}
