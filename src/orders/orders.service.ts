import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrdersRepository } from './orders.repository';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { StockMovement, MovementType } from '../products/entities/stock-movement.entity';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { Cart } from '../cart/entities/cart.entity';
import { CartService } from '../cart/cart.service';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { buildPaginatedResult, PaginationQueryDto } from '../common/pagination';
import { OrderStatus } from './entities/order.entity';
import { OrderFilterDto } from './dto/order-filter.dto';
import { randomInt } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly cartService: CartService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  async createFromCart(userId: number, dto: CreateOrderDto) {
    const cartWithTotals = await this.cartService.viewCart(userId);
    if (cartWithTotals.items.length === 0) {
      throw new BadRequestException('The cart is empty');
    }

      const sortedItems = [...cartWithTotals.items].sort((a, b) => a.product.id - b.product.id,);
      const savedOrder = await this.dataSource.transaction(async (manager) => {
      const productsRepo = manager.getRepository(Product);
      const ordersRepo = manager.getRepository(Order);
      const cartsRepo = manager.getRepository(Cart);

      const details: { product: Product; quantity: number; unitPrice: number }[] = [];

      for (const item of sortedItems) {
  
        const product = await productsRepo
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :id', { id: item.product.id })
          .andWhere('product.active = :active', { active: true })
          .getOne();

        if (!product) {
          throw new NotFoundException(`Product ${item.product.name} no longer exists`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          );
        }

        product.stock -= item.quantity;
        await productsRepo.save(product);

        await manager.save(
          manager.create(StockMovement, {
            product: { id: product.id },
            type: MovementType.OUT,
            quantity: item.quantity,
            reason: 'Venta online',
          }),
        );

        details.push({
          product,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }

      const orderNumber = `ORD-${Date.now()}-${randomInt(1000, 10000)}`;
      const order = ordersRepo.create({
        user: { id: userId } as any,
        orderNumber,
        paymentMethod: dto.paymentMethod,
        total: cartWithTotals.total,
        details: details as any,
      });
      const saved = await ordersRepo.save(order);

      const cart = await cartsRepo.findOne({ where: { user: { id: userId } } });
      if (cart) {
        cart.items = [];
        await cartsRepo.save(cart);
      }

      return saved;
    });
   
    const fullOrder = await this.ordersRepository.findOneBy({ id: savedOrder.id });

    if (fullOrder) {
      void this.mailService.notifyNewOrder(fullOrder);
    }

    return savedOrder;
  }

  async findByUser(userId: number,pagination: PaginationQueryDto,status?: 'pending' | 'delivered' | 'cancelled') {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.ordersRepository.findByUserId(userId, page, limit, status);
      return buildPaginatedResult(data, total, page, limit);
  }

  async findAll(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.ordersRepository.findAllPaginated(page, limit);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findCancelled(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.ordersRepository.findCancelledPaginated(page, limit);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findDelivered(pagination: PaginationQueryDto, month?: string, year?: string) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.ordersRepository.findDeliveredPaginated(
      page,
      limit,
      month,
      year,
    );
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: number) {
    const order = await this.ordersRepository.findOneBy({ id });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findOneForUser(id: number, user: { id: number; role: string }) {
    const order = await this.findOne(id);
    if (user.role !== 'admin' && order.user.id !== user.id) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async search(filters: OrderFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    const [data, total] =
      await this.ordersRepository.searchWithFilters(filters);

    return buildPaginatedResult(
      data,
      total,
      page,
      limit,
    );
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const order = await this.findOne(id);

    const nextStatus: Record<OrderStatus, OrderStatus | null> = {
      [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
      [OrderStatus.CONFIRMED]: OrderStatus.IN_PREPARATION,
      [OrderStatus.IN_PREPARATION]: OrderStatus.WITHDRAW,
      [OrderStatus.WITHDRAW]: OrderStatus.DELIVERED,
      [OrderStatus.DELIVERED]: null,
      [OrderStatus.CANCELLED]: null,
    };

    const expectedNextStatus = nextStatus[order.status];

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'El pedido ya fue entregado y no puede cambiar de estado.',
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('El pedido está cancelado y no puede cambiar de estado.');
    }

    if (dto.status !== expectedNextStatus) {
      throw new BadRequestException(
        `No se puede pasar de "${order.status}" a "${dto.status}".`,
      );
    }

    if (
      dto.status === OrderStatus.DELIVERED &&
      !order.customerNotified
    ) {
      throw new BadRequestException(
        'No se puede marcar el pedido como entregado porque el cliente todavía no fue notificado.',
      );
    }

    order.status = dto.status;

    if (dto.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    const updated = await this.ordersRepository.save(order);

      void this.mailService.notifyStatusChange(updated);

    return updated;
    }

    async getStatistics() {
    const delivered = await this.ordersRepository.find({
      where: { status: OrderStatus.DELIVERED },
    });

    const monthly = {};
    const yearly = {};

    delivered.forEach(order => {
      const date = new Date(order.createdAt);

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, '0')}`;

      const yearKey = `${date.getFullYear()}`;

      monthly[monthKey] ??= {
        orders: 0,
        total: 0,
      };

      yearly[yearKey] ??= {
        orders: 0,
        total: 0,
      };

      monthly[monthKey].orders++;
      monthly[monthKey].total += Number(order.total);

      yearly[yearKey].orders++;
      yearly[yearKey].total += Number(order.total);
    });

    return {
      delivered,
      monthly,
      yearly,
    };
  }

  async cancel(id: number, requester: { id: number; role: string }, dto: CancelOrderDto) {
    const cancelled = await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
        relations: { user: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      const isAdmin = requester.role === 'admin';
      if (!isAdmin && order.user.id !== requester.id) {
        throw new ForbiddenException('No podés cancelar un pedido ajeno.');
      }
      if (!isAdmin && order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Solo se puede cancelar un pedido pendiente. Contactá al negocio.');
      }
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException(`No se puede cancelar un pedido "${order.status}".`);
      }

      const details = await manager.find(OrderDetail, {
        where: { order: { id } },
        relations: { product: true },
      });
      details.sort((a, b) => a.product.id - b.product.id);

      for (const detail of details) {
        await manager.increment(Product, { id: detail.product.id }, 'stock', detail.quantity);
        await manager.save(
          manager.create(StockMovement, {
            product: { id: detail.product.id },
            type: MovementType.IN,
            quantity: detail.quantity,
            reason: `Cancelación pedido ${order.orderNumber}`,
          }),
        );
      }

      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancelledBy = isAdmin ? 'admin' : 'customer';
      order.cancelledByUser = isAdmin ? ({ id: requester.id } as User) : null;
      order.cancelReason = isAdmin ? dto.reason?.trim() || null : null;
      return manager.save(order);
    });

    const full = await this.ordersRepository.findOneBy({ id: cancelled.id });
    if (full) void this.mailService.notifyStatusChange(full);

    return cancelled;
  }

  async notifyCustomer(
    id: number,
    method: 'whatsapp'
  ) {

    const order = await this.findOne(id);

    order.customerNotified = true;
    order.notificationMethod = method;
    order.customerNotifiedAt = new Date();

    return this.ordersRepository.save(order);
  }
}
