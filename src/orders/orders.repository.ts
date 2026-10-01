import { Injectable } from '@nestjs/common';
import { DataSource, Repository,Not,Between } from 'typeorm';
import { Order,OrderStatus } from './entities/order.entity';
import { OrderFilterDto } from './dto/order-filter.dto';

@Injectable()
export class OrdersRepository extends Repository<Order> {
  constructor(dataSource: DataSource) {
    super(Order, dataSource.createEntityManager());
  }

  findByUserId(
    userId: number,
    page: number,
    limit: number,
    delivered?: boolean,
  ): Promise<[Order[], number]> {
    const query = this.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.details', 'details')
      .leftJoinAndSelect('details.product', 'product')
      .where('user.id = :userId', { userId });

    if (delivered === true) {
      query.andWhere('order.status = :delivered', {
        delivered: OrderStatus.DELIVERED,
      });
    } else if (delivered === false) {
      query.andWhere('order.status != :delivered', {
        delivered: OrderStatus.DELIVERED,
      });
    }

    query
      .addSelect(
        `
        CASE
          WHEN order.status = :withdraw THEN 1
          WHEN order.status = :inPreparation THEN 2
          WHEN order.status = :confirmed THEN 3
          WHEN order.status = :pending THEN 4
          ELSE 5
        END
        `,
        'status_priority',
      )
      .setParameters({
        withdraw: OrderStatus.WITHDRAW,
        inPreparation: OrderStatus.IN_PREPARATION,
        confirmed: OrderStatus.CONFIRMED,
        pending: OrderStatus.PENDING,
      })
      .orderBy('status_priority', 'ASC')
      .addOrderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  findAllPaginated(page: number, limit: number): Promise<[Order[], number]> {
    return this.findAndCount({
      where: { status: Not(OrderStatus.DELIVERED) },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

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

  async searchWithFilters(
    filters: OrderFilterDto,
  ): Promise<[Order[], number]> {
    const query = this.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.details', 'details')
      .leftJoinAndSelect('details.product', 'product')
      .where('order.status != :delivered', {
        delivered: OrderStatus.DELIVERED,
      });

    if (filters.search?.trim()) {
      const search = filters.search
        .trim()
        .toLowerCase();

      query.andWhere(
        `(
          LOWER(order.orderNumber) LIKE :search
          OR LOWER(user.name) LIKE :search
          OR LOWER(user.email) LIKE :search
          OR DATE_FORMAT(order.createdAt, '%d/%m/%Y') LIKE :search
          OR DATE_FORMAT(order.createdAt, '%Y-%m-%d') LIKE :search
          OR (
            order.status = :pending
            AND 'pendiente' LIKE :search
          )
          OR (
            order.status = :confirmed
            AND 'confirmado' LIKE :search
          )
          OR (
            order.status = :inPreparation
            AND 'en preparacion' LIKE :search
          )
          OR (
            order.status = :withdraw
            AND 'retirar' LIKE :search
          )
        )`,
        {
          search: `%${search}%`,
          pending: OrderStatus.PENDING,
          confirmed: OrderStatus.CONFIRMED,
          inPreparation: OrderStatus.IN_PREPARATION,
          withdraw: OrderStatus.WITHDRAW,
        },
      );
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    query
      .addSelect(
        `
        CASE
          WHEN order.status = :withdraw THEN 1
          WHEN order.status = :inPreparation THEN 2
          WHEN order.status = :confirmed THEN 3
          WHEN order.status = :pending THEN 4
          ELSE 5
        END
        `,
        'status_priority',
      )
      .setParameter('withdraw', OrderStatus.WITHDRAW)
      .setParameter('inPreparation', OrderStatus.IN_PREPARATION)
      .setParameter('confirmed', OrderStatus.CONFIRMED)
      .setParameter('pending', OrderStatus.PENDING)
      .orderBy('status_priority', 'ASC')
      .addOrderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }
}


