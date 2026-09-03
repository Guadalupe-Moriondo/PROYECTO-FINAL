import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrdersRepository } from './orders.repository';
import { ProductsRepository } from '../products/products.repository';
import { Product } from '../products/entities/product.entity';
import { Order } from './entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartService } from '../cart/cart.service';
import { CartRepository } from '../cart/cart.repository';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { buildPaginatedResult, PaginationQueryDto } from '../common/pagination';
import { OrderStatus } from './entities/order.entity';


@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly cartService: CartService,
    private readonly cartRepository: CartRepository,
    private readonly mailService: MailService,
    // DataSource es la conexion "raiz" de TypeORM. La necesitamos aca
    // porque dataSource.transaction() es el punto de entrada para
    // ejecutar varias operaciones como una sola unidad atomica.
    private readonly dataSource: DataSource,
  ) {}

  // Convierte el carrito actual del usuario en un pedido formal.
  // Esto cubre el flujo: carrito -> "finalizar compra" -> pedido con seguimiento.
  async createFromCart(userId: number, dto: CreateOrderDto) {
    const cartWithTotals = await this.cartService.viewCart(userId);
    if (cartWithTotals.items.length === 0) {
      throw new BadRequestException('The cart is empty');
    }

    // dataSource.transaction() abre una transaccion de base de datos:
    // TODO lo que pasa adentro del callback usa el mismo "manager"
    // (piensen en el como una conexion exclusiva y temporal a la BD).
    // Si en cualquier punto se lanza un error, TypeORM hace ROLLBACK
    // automaticamente: es como si nada de lo que pasa aca adentro
    // hubiera ocurrido. Si todo termina bien, hace COMMIT y los cambios
    // quedan guardados de forma definitiva, todos juntos.
    const savedOrder = await this.dataSource.transaction(async (manager) => {
      // Dentro de la transaccion no usamos this.productosRepository
      // directamente, sino manager.getRepository(Producto): asi nos
      // aseguramos de que las consultas participen de ESTA transaccion
      // en particular, y no de una conexion suelta por fuera.
      const productsRepo = manager.getRepository(Product);
      const ordersRepo = manager.getRepository(Order);
      const cartsRepo = manager.getRepository(Cart);

      const details: { product: Product; quantity: number; unitPrice: number }[] = [];

      for (const item of cartWithTotals.items) {
        // setLock('pessimistic_write') traduce a un SELECT ... FOR UPDATE.
        // Esto le dice a MySQL: "bloquea esta fila de producto hasta que
        // termine mi transaccion". Si otro cliente intenta comprar el
        // MISMO producto al mismo tiempo, su transaccion queda esperando
        // hasta que la primera termine (commit o rollback), evitando que
        // los dos lean "hay stock" antes de que ninguno lo descuente.
        const product = await productsRepo
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :id', { id: item.product.id })
          .andWhere('product.active = :active', { active: true })
          .getOne();

        if (!product) {
          throw new NotFoundException(`Product ${item.product.name} no longer exists`);
        }

        // Revalidamos el stock ACA (con el dato recien leido y bloqueado),
        // no confiamos en el valor que traiamos del carrito desde antes,
        // porque pudo haber cambiado entre que se armo el carrito y ahora.
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          );
        }

        product.stock -= item.quantity;
        await productsRepo.save(product);

        details.push({
          product,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }

      const orderNumber = `ORD-${Date.now()}`;
      const order = ordersRepo.create({
        user: { id: userId } as any,
        orderNumber,
        paymentMethod: dto.paymentMethod,
        total: cartWithTotals.total,
        details: details as any,
      });
      const saved = await ordersRepo.save(order);

      // Vaciamos el carrito DENTRO de la misma transaccion: si algo
      // de lo anterior falla, el carrito tampoco se toca (rollback).
      const cart = await cartsRepo.findOne({ where: { user: { id: userId } } });
      if (cart) {
        cart.items = [];
        await cartsRepo.save(cart);
      }

      return saved;
    });
    // A partir de aca la transaccion ya hizo COMMIT: el pedido y el
    // descuento de stock quedaron guardados de forma definitiva.

    // La notificacion por email queda A PROPOSITO fuera de la transaccion:
    // enviar un correo no es algo que se pueda "revertir" como un UPDATE,
    // y no tiene sentido mantener bloqueado el producto en la BD mientras
    // esperamos que responda un servidor SMTP externo.
    const fullOrder = await this.ordersRepository.findOneBy({ id: savedOrder.id });

    if (fullOrder) {
      void this.mailService.notifyNewOrder(fullOrder);
    }

    return savedOrder;
  }

  async findByUser(userId: number, pagination: PaginationQueryDto, delivered?: boolean) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.ordersRepository.findByUserId(userId, page, limit, delivered);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findAll(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.ordersRepository.findAllPaginated(page, limit);
    return buildPaginatedResult(data, total, page, limit);
  }

  // Historial: pedidos ya entregados. Una vez que un pedido llega a este
  // estado, desaparece de findAll() y solo se puede consultar por aca.
  // "month" ("YYYY-MM") o "year" ("YYYY") filtran por periodo puntual.
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

  async updateStatus(id: number, dto: UpdateStatusDto) {
  const order = await this.findOne(id);

  const nextStatus: Record<OrderStatus, OrderStatus | null> = {
    [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
    [OrderStatus.CONFIRMED]: OrderStatus.IN_PREPARATION,
    [OrderStatus.IN_PREPARATION]: OrderStatus.WITHDRAW,
    [OrderStatus.WITHDRAW]: OrderStatus.DELIVERED,
    [OrderStatus.DELIVERED]: null,
  };

  const expectedNextStatus = nextStatus[order.status];

  // No permitir cambiar un pedido ya entregado
  if (order.status === OrderStatus.DELIVERED) {
    throw new BadRequestException(
      'El pedido ya fue entregado y no puede cambiar de estado.',
    );
  }

  // No permitir saltear estados
  if (dto.status !== expectedNextStatus) {
    throw new BadRequestException(
      `No se puede pasar de "${order.status}" a "${dto.status}".`,
    );
  }

  // Para entregar, el cliente debe haber sido notificado
  if (
    dto.status === OrderStatus.DELIVERED &&
    !order.customerNotified
  ) {
    throw new BadRequestException(
      'No se puede marcar el pedido como entregado porque el cliente todavía no fue notificado.',
    );
  }

  order.status = dto.status;

  const updated = await this.ordersRepository.save(order);

    void this.mailService.notifyStatusChange(updated);

  return updated;
  }

  async getStatistics() {
  const delivered = await this.ordersRepository.find({
    where: { status: OrderStatus.DELIVERED },
  });

  const now = new Date();

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
