import { Injectable } from '@nestjs/common';
import { DataSource, Repository,Not,Between } from 'typeorm';
import { Order,OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersRepository extends Repository<Order> {
  constructor(private dataSource: DataSource) {
    super(Order, dataSource.createEntityManager());
  }

  findByUserId(userId: number, page: number, limit: number): Promise<[Order[], number]> {
    return this.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

   // Pedidos "activos": todo lo que todavia no fue entregado. Una vez que
  // un pedido pasa a DELIVERED, deja de aparecer aca y pasa a vivir
  // unicamente en el historial (findDeliveredPaginated).
  findAllPaginated(page: number, limit: number): Promise<[Order[], number]> {
    return this.findAndCount({
      where: { status: Not(OrderStatus.DELIVERED) },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

   // Historial de pedidos entregados, paginado. Si se pasa "month"
  // ("YYYY-MM"), filtra por ese mes puntual. Si se pasa "year" ("YYYY")
  // y no hay mes, filtra por ese año completo. Si vienen los dos, "month"
  // manda (es mas especifico).
  findDeliveredPaginated(
    page: number,
    limit: number,
    month?: string,
    year?: string,
  ): Promise<[Order[], number]> {
    const where: any = { status: OrderStatus.DELIVERED };

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 1, 0, 0, 0, 0);
      where.createdAt = Between(start, new Date(end.getTime() - 1));
    } else if (year) {
      const y = Number(year);
      const start = new Date(y, 0, 1, 0, 0, 0, 0);
      const end = new Date(y + 1, 0, 1, 0, 0, 0, 0);
      where.createdAt = Between(start, new Date(end.getTime() - 1));
    }

    return this.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
