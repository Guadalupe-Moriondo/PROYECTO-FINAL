import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { ProductsRepository } from '../products/products.repository';
import { CartService } from '../cart/cart.service';
import { CartRepository } from '../cart/cart.repository';
import { MailService } from '../mail/mail.service';
import { OrderStatus } from './entities/order.entity';
import { PaymentMethod } from './entities/order.entity';

describe('OrdersService', () => {
  let service: OrdersService;

  const ordersRepositoryMock = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findByUserId: jest.fn(),
    findAllPaginated: jest.fn(),
    findDeliveredPaginated: jest.fn(),
  };

  const productsRepositoryMock = {};

  const cartServiceMock = {
    viewCart: jest.fn(),
  };

  const cartRepositoryMock = {};

  const mailServiceMock = {
    notifyNewOrder: jest.fn(),
    notifyStatusChange: jest.fn(),
  };

  const dataSourceMock = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: ordersRepositoryMock,
        },
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
        {
          provide: CartService,
          useValue: cartServiceMock,
        },
        {
          provide: CartRepository,
          useValue: cartRepositoryMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería rechazar la creación de un pedido si el carrito está vacío', async () => {
  cartServiceMock.viewCart.mockResolvedValue({
    items: [],
    total: 0,
  });

  await expect(
    service.createFromCart(1, {
      paymentMethod: PaymentMethod.CASH,
    }),
  ).rejects.toThrow('The cart is empty');

  expect(cartServiceMock.viewCart).toHaveBeenCalledWith(1);
  expect(dataSourceMock.transaction).not.toHaveBeenCalled();
});

it('debería rechazar el pedido si no hay stock suficiente', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    stock: 2,
    price: 1000,
    active: true,
  };

  cartServiceMock.viewCart.mockResolvedValue({
    items: [
      {
        product,
        quantity: 5,
      },
    ],
    total: 5000,
  });

  const productsRepoMock = {
    createQueryBuilder: jest.fn().mockReturnValue({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(product),
    }),
    save: jest.fn(),
  };

  const managerMock = {
    getRepository: jest.fn((entity) => {
      if (entity.name === 'Product') {
        return productsRepoMock;
      }

      return {};
    }),
  };

  dataSourceMock.transaction.mockImplementation(async (callback) => {
    return callback(managerMock);
  });

  await expect(
    service.createFromCart(1, {
      paymentMethod: PaymentMethod.CASH,
    }),
  ).rejects.toThrow(
    'Insufficient stock for Disco agrícola. Available: 2',
  );

  expect(productsRepoMock.createQueryBuilder).toHaveBeenCalledWith(
    'product',
  );

  expect(productsRepoMock.save).not.toHaveBeenCalled();
});

it('debería rechazar el pedido si el producto ya no existe o está inactivo', async () => {
  const productFromCart = {
    id: 1,
    name: 'Disco agrícola',
    stock: 10,
    price: 1000,
    active: true,
  };

  cartServiceMock.viewCart.mockResolvedValue({
    items: [
      {
        product: productFromCart,
        quantity: 2,
      },
    ],
    total: 2000,
  });

  const productsRepoMock = {
    createQueryBuilder: jest.fn().mockReturnValue({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    }),
    save: jest.fn(),
  };

  const managerMock = {
    getRepository: jest.fn((entity) => {
      if (entity.name === 'Product') {
        return productsRepoMock;
      }

      return {};
    }),
  };

  dataSourceMock.transaction.mockImplementation(async (callback) => {
    return callback(managerMock);
  });

  await expect(
    service.createFromCart(1, {
      paymentMethod: PaymentMethod.CASH,
    }),
  ).rejects.toThrow(
    'Product Disco agrícola no longer exists',
  );

  expect(productsRepoMock.save).not.toHaveBeenCalled();
});

it('debería crear correctamente un pedido y descontar el stock', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    stock: 10,
    price: 1500,
    active: true,
  };

  const cart = {
    id: 5,
    items: [
      {
        id: 20,
        product,
        quantity: 3,
      },
    ],
    total: 4500,
  };

  const savedOrder = {
    id: 100,
    orderNumber: 'ORD-123456',
    user: { id: 1 },
    paymentMethod: 'cash',
    total: 4500,
    details: [
      {
        product,
        quantity: 3,
        unitPrice: 1500,
      },
    ],
  };

  cartServiceMock.viewCart.mockResolvedValue(cart);

  const productsRepoMock = {
    createQueryBuilder: jest.fn().mockReturnValue({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(product),
    }),
    save: jest.fn().mockResolvedValue(product),
  };

  const ordersRepoMock = {
    create: jest.fn().mockReturnValue(savedOrder),
    save: jest.fn().mockResolvedValue(savedOrder),
  };

  const cartsRepoMock = {
    findOne: jest.fn().mockResolvedValue(cart),
    save: jest.fn().mockResolvedValue(cart),
  };

  const managerMock = {
    getRepository: jest.fn((entity) => {
      if (entity.name === 'Product') {
        return productsRepoMock;
      }

      if (entity.name === 'Order') {
        return ordersRepoMock;
      }

      if (entity.name === 'Cart') {
        return cartsRepoMock;
      }

      return {};
    }),
  };

  dataSourceMock.transaction.mockImplementation(async (callback) => {
    return callback(managerMock);
  });

  const result = await service.createFromCart(1, {
    paymentMethod: PaymentMethod.CASH,
  });

  expect(result).toEqual(savedOrder);

  expect(productsRepoMock.createQueryBuilder).toHaveBeenCalledWith(
    'product',
  );

  expect(productsRepoMock.createQueryBuilder().setLock).toHaveBeenCalledWith(
    'pessimistic_write',
  );

  expect(productsRepoMock.save).toHaveBeenCalledWith(product);

  expect(product.stock).toBe(7);

  expect(ordersRepoMock.create).toHaveBeenCalled();

  expect(ordersRepoMock.save).toHaveBeenCalledWith(savedOrder);

  expect(cart.items).toEqual([]);

  expect(cartsRepoMock.save).toHaveBeenCalledWith(cart);

  expect(mailServiceMock.notifyNewOrder).toHaveBeenCalledWith(savedOrder);
});

it('debería cambiar correctamente un pedido de pending a confirmed', async () => {
  const order = {
    id: 1,
    status: OrderStatus.PENDING,
    customerNotified: false,
  };

  const updatedOrder = {
    ...order,
    status: OrderStatus.CONFIRMED,
  };

  ordersRepositoryMock.findOneBy.mockResolvedValue(order);
  ordersRepositoryMock.save.mockResolvedValue(updatedOrder);

  const result = await service.updateStatus(1, {
    status: OrderStatus.CONFIRMED,
  });

  expect(result).toEqual(updatedOrder);

  expect(ordersRepositoryMock.findOneBy).toHaveBeenCalledWith({
    id: 1,
  });

  expect(ordersRepositoryMock.save).toHaveBeenCalledWith(order);

  expect(mailServiceMock.notifyStatusChange).toHaveBeenCalledWith(
    updatedOrder,
  );
});

it('debería rechazar un cambio de estado que saltee una etapa', async () => {
  const order = {
    id: 1,
    status: OrderStatus.PENDING,
    customerNotified: false,
  };

  ordersRepositoryMock.findOneBy.mockResolvedValue(order);

  await expect(
    service.updateStatus(1, {
      status: OrderStatus.WITHDRAW,
    }),
  ).rejects.toThrow(
    'No se puede pasar de "pending" a "withdraw".',
  );

  expect(ordersRepositoryMock.save).not.toHaveBeenCalled();

  expect(mailServiceMock.notifyStatusChange).not.toHaveBeenCalled();
});

it('debería rechazar pasar un pedido a delivered si el cliente no fue notificado', async () => {
  const order = {
    id: 1,
    status: OrderStatus.WITHDRAW,
    customerNotified: false,
  };

  ordersRepositoryMock.findOneBy.mockResolvedValue(order);

  await expect(
    service.updateStatus(1, {
      status: OrderStatus.DELIVERED,
    }),
  ).rejects.toThrow(
    'No se puede marcar el pedido como entregado porque el cliente todavía no fue notificado.',
  );

  expect(ordersRepositoryMock.save).not.toHaveBeenCalled();

  expect(mailServiceMock.notifyStatusChange).not.toHaveBeenCalled();
});

it('debería permitir pasar un pedido a delivered si el cliente fue notificado', async () => {
  const order = {
    id: 1,
    status: OrderStatus.WITHDRAW,
    customerNotified: true,
  };

  const updatedOrder = {
    ...order,
    status: OrderStatus.DELIVERED,
  };

  ordersRepositoryMock.findOneBy.mockResolvedValue(order);
  ordersRepositoryMock.save.mockResolvedValue(updatedOrder);

  const result = await service.updateStatus(1, {
    status: OrderStatus.DELIVERED,
  });

  expect(result).toEqual(updatedOrder);

  expect(order.status).toBe(OrderStatus.DELIVERED);

  expect(ordersRepositoryMock.save).toHaveBeenCalledWith(order);

  expect(mailServiceMock.notifyStatusChange).toHaveBeenCalledWith(
    updatedOrder,
  );
});

it('debería rechazar cambiar el estado de un pedido ya entregado', async () => {
  const order = {
    id: 1,
    status: OrderStatus.DELIVERED,
    customerNotified: true,
  };

  ordersRepositoryMock.findOneBy.mockResolvedValue(order);

  await expect(
    service.updateStatus(1, {
      status: OrderStatus.CONFIRMED,
    }),
  ).rejects.toThrow(
    'El pedido ya fue entregado y no puede cambiar de estado.',
  );

  expect(ordersRepositoryMock.save).not.toHaveBeenCalled();

  expect(mailServiceMock.notifyStatusChange).not.toHaveBeenCalled();
});
});