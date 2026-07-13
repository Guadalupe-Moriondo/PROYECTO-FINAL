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
    this.mailService.notifyNewOrder(savedOrder);

    return savedOrder;
  }

  async findByUser(userId: number, pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.ordersRepository.findByUserId(userId, page, limit);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findAll(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [data, total] = await this.ordersRepository.findAllPaginated(page, limit);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: number) {
    const order = await this.ordersRepository.findOneBy({ id });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const order = await this.findOne(id);
    order.status = dto.status;
    const updated = await this.ordersRepository.save(order);

    // Aviso "bonus" al cliente. Mismo criterio: no bloqueante, no rompe
    // la respuesta HTTP si el email falla.
    this.mailService.notifyStatusChange(updated);

    return updated;
  }
}
