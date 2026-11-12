import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomInt } from 'crypto';
import { OrdersRepository } from './orders.repository';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
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
      throw new BadRequestException('El carrito está vacío.');
    }

    const sortedItems = [...cartWithTotals.items].sort((a, b) => a.product.id - b.product.id);
    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const productsRepo = manager.getRepository(Product);
      const ordersRepo = manager.getRepository(Order);
      const cartsRepo = manager.getRepository(Cart);
      const details: { product: Product; quantity: number; unitPrice: number }[] = [];
      const soldItems: { productId: number; quantity: number }[] = [];

      for (const item of sortedItems) {
        const product = await productsRepo
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :id', { id: item.product.id })
          .andWhere('product.active = :active', { active: true })
          .getOne();

        if (!product) {
          throw new NotFoundException(`El producto ${item.product.name} ya no existe.`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,);
        }

        product.stock -= item.quantity;
        await productsRepo.save(product);

        soldItems.push({ productId: product.id, quantity: item.quantity });

        details.push({
          product,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }

      const total = Math.round(
        details.reduce((acc, d) => acc + Number(d.unitPrice) * d.quantity, 0) * 100,
      ) / 100;

      const orderNumber = `ORD-${Date.now()}-${randomInt(1000, 10000)}`;
      const order = ordersRepo.create({
        user: { id: userId } as any,
        orderNumber,
        paymentMethod: dto.paymentMethod,
        total: total,
        details: details as any,
      });
      const saved = await ordersRepo.save(order);

      for (const sold of soldItems) {
        await manager.save(
          manager.create(StockMovement, {
            product: { id: sold.productId },
            type: MovementType.OUT,
            quantity: sold.quantity,
            reason: 'Venta online',
            user: { id: userId },
            order: { id: saved.id },
          }),
        );
      }

      await manager.save(
        manager.create(OrderStatusHistory, {
          order: { id: saved.id },
          status: OrderStatus.PENDING,
          changedBy: { id: userId },
        }),
      );

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

  async findByUser(userId: number, pagination: PaginationQueryDto, status?: 'pending' | 'delivered' | 'cancelled') {
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
    if (!order) throw new NotFoundException('Orden no encontrada.');
    return order;
  }

  async findOneForUser(id: number, user: { id: number; role: string }) {
    const order = await this.findOne(id);
    if (user.role !== 'admin' && order.user.id !== user.id) {
      throw new NotFoundException('Orden no encontrada.'); 
    }
    return order;
  }

  async search(filters: OrderFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const [data, total] = await this.ordersRepository.searchWithFilters(filters);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findStatusHistory(
    id: number,
    requester: { id: number; role: string },
  ) {
    const order = await this.findOne(id);

    if (requester.role !== 'admin' && order.user?.id !== requester.id) {
      throw new ForbiddenException('No tenés permiso para consultar este historial.');
    }

    const entries = await this.dataSource.getRepository(OrderStatusHistory).find({
      where: { order: { id } },
      relations: { changedBy: true },
      select: {
        id: true,
        status: true,
        createdAt: true,
        changedBy: { id: true, name: true, role: true },
      },
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    if (requester.role === 'admin') return entries;

    return entries.map((e) => ({
      id: e.id,
      status: e.status,
      createdAt: e.createdAt,
    }));
  }

  async updateStatus(id: number, dto: UpdateStatusDto, adminId: number) {
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
      throw new BadRequestException('El pedido ya fue entregado y no puede cambiar de estado.',);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('El pedido está cancelado y no puede cambiar de estado.');
    }

    if (dto.status !== expectedNextStatus) {
      throw new BadRequestException(`No se puede pasar de "${order.status}" a "${dto.status}".`,);
    }

    if (
      dto.status === OrderStatus.DELIVERED && !order.customerNotified
    ) {
      throw new BadRequestException('No se puede marcar el pedido como entregado porque el cliente todavía no fue notificado.',);
    }

    const previousStatus = order.status;

    order.status = dto.status;

    if (dto.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    const updated = await this.dataSource.transaction(async (manager) => {
      const result = await manager.update(
        Order,
        { id: order.id, status: previousStatus },
        { status: dto.status, deliveredAt: order.deliveredAt },
      );

      if (!result.affected) {
        throw new BadRequestException('El pedido cambió de estado mientras lo modificabas. Actualizá la pantalla.');
      }

      await manager.save(
        manager.create(OrderStatusHistory, {
          order: { id: order.id },
          status: dto.status,
          changedBy: { id: adminId },
        }),
      );

      return order;
    });

    void this.mailService.notifyStatusChange(updated);

    return updated;
  }

  async getStatistics() {
    const rows = await this.ordersRepository
      .createQueryBuilder('o')
      .select("DATE_FORMAT(o.deliveredAt, '%Y-%m')", 'month')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('SUM(o.total)', 'total')
      .where('o.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('o.deliveredAt IS NOT NULL')
      .groupBy('month')
      .getRawMany();

    const monthly: Record<string, { orders: number; total: number }> = {};
    const yearly: Record<string, { orders: number; total: number }> = {};

    for (const r of rows) {
      const orders = Number(r.orders);
      const total = Number(r.total);
      const year = String(r.month).slice(0, 4);
      monthly[r.month] = { orders, total };
      yearly[year] ??= { orders: 0, total: 0 };
      yearly[year].orders += orders;
      yearly[year].total += total;
    }
    return { monthly, yearly };
  }

  async cancel(id: number, requester: { id: number; role: string }, dto: CancelOrderDto) {
    const cancelled = await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
        relations: { user: true },
      });
      if (!order) throw new NotFoundException('Orden no encontrada.');

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
            reason: `Cancelación pedido`,
            user: { id: requester.id },
            order: { id: order.id },
          }),
        );
      }

      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancelledBy = isAdmin ? 'admin' : 'customer';
      order.cancelledByUser = isAdmin ? ({ id: requester.id } as User) : null;
      order.cancelReason = isAdmin ? dto.reason?.trim() || null : null;

      const savedOrder = await manager.save(order);
      await manager.save(
        manager.create(OrderStatusHistory, {
          order: { id: savedOrder.id },
          status: OrderStatus.CANCELLED,
          changedBy: { id: requester.id },
        }),
      );
      return savedOrder;
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

    if (order.status !== OrderStatus.WITHDRAW) {
      throw new BadRequestException('Solo se puede notificar un pedido listo para retirar.');
    }

    order.customerNotified = true;
    order.notificationMethod = method;
    order.customerNotifiedAt = new Date();

    return this.ordersRepository.save(order);
  }
}