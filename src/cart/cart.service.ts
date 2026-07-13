import { Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { ProductsRepository } from '../products/products.repository';
import { AddItemDto } from './dto/add-item.dto';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  // Trae el carrito del usuario, o le crea uno vacio si es la primera vez
  private async getOrCreate(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = this.cartRepository.create({ user: { id: userId } as any, items: [] });
      cart = await this.cartRepository.save(cart);
    }
    return cart;
  }

  async viewCart(userId: number) {
    const cart = await this.getOrCreate(userId);
    return this.calculateTotals(cart);
  }

  async addItem(userId: number, dto: AddItemDto) {
    const product = await this.productsRepository.findOneBy({ id: dto.productId });
    if (!product) throw new NotFoundException('Product not found');

    const cart = await this.getOrCreate(userId);
    const existingItem = cart.items.find((i) => i.product.id === dto.productId);

    if (existingItem) {
      existingItem.quantity += dto.quantity;
    } else {
      cart.items.push({ product, quantity: dto.quantity } as any);
    }

    // Gracias a cascade:true en la relacion OneToMany, save() en el carrito
    // tambien guarda/actualiza los items automaticamente
    const saved = await this.cartRepository.save(cart);
    return this.calculateTotals(saved);
  }

  async updateQuantity(userId: number, itemId: number, quantity: number) {
    const cart = await this.getOrCreate(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found in cart');

    item.quantity = quantity;
    const saved = await this.cartRepository.save(cart);
    return this.calculateTotals(saved);
  }

  async removeItem(userId: number, itemId: number) {
    const cart = await this.getOrCreate(userId);
    cart.items = cart.items.filter((i) => i.id !== itemId);
    const saved = await this.cartRepository.save(cart);
    return this.calculateTotals(saved);
  }

  // Calcula subtotal por item y total general (requerimiento funcional 7)
  private calculateTotals(cart: Cart) {
    const items = cart.items.map((item) => ({
      ...item,
      subtotal: Number(item.product.price) * item.quantity,
    }));
    const total = items.reduce((acc, item) => acc + item.subtotal, 0);
    return { id: cart.id, items, total };
  }
}
