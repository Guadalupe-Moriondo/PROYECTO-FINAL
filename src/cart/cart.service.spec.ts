import { Test, TestingModule } from '@nestjs/testing';

import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { ProductsRepository } from '../products/products.repository';

describe('CartService', () => {
  let service: CartService;

  const cartRepositoryMock = {
    findByUserId: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const productsRepositoryMock = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CartRepository,
          useValue: cartRepositoryMock,
        },
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería calcular correctamente los subtotales y el total del carrito', async () => {
  const cart = {
    id: 1,
    items: [
      {
        id: 10,
        product: {
          id: 1,
          name: 'Disco agrícola',
          price: 1000,
          active: true,
        },
        quantity: 2,
      },
      {
        id: 11,
        product: {
          id: 2,
          name: 'Correa',
          price: 500,
          active: true,
        },
        quantity: 3,
      },
    ],
  };

  cartRepositoryMock.findByUserId.mockResolvedValue(cart);

  const result = await service.viewCart(1);

  expect(result).toEqual({
    id: 1,
    items: [
      {
        ...cart.items[0],
        subtotal: 2000,
      },
      {
        ...cart.items[1],
        subtotal: 1500,
      },
    ],
    total: 3500,
  });

  expect(cartRepositoryMock.findByUserId).toHaveBeenCalledWith(1);
});

it('debería crear un carrito vacío si el usuario no tiene uno', async () => {
  const newCart = {
    id: 10,
    user: { id: 1 },
    items: [],
  };

  cartRepositoryMock.findByUserId.mockResolvedValue(null);

  cartRepositoryMock.create.mockReturnValue(newCart);

  cartRepositoryMock.save.mockResolvedValue(newCart);

  const result = await service.viewCart(1);

  expect(cartRepositoryMock.findByUserId).toHaveBeenCalledWith(1);

  expect(cartRepositoryMock.create).toHaveBeenCalledWith({
    user: { id: 1 },
    items: [],
  });

  expect(cartRepositoryMock.save).toHaveBeenCalledWith(newCart);

  expect(result).toEqual({
    id: 10,
    items: [],
    total: 0,
  });
});


it('debería agregar correctamente un producto al carrito', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 10,
    active: true,
  };

  const cart = {
    id: 5,
    user: { id: 1 },
    items: [] as any[],
  };

  const savedCart = {
    ...cart,
    items: [
      {
        product,
        quantity: 2,
      },
    ],
  };

  productsRepositoryMock.findOneBy.mockResolvedValue(product);

  cartRepositoryMock.findByUserId.mockResolvedValue(cart);

  cartRepositoryMock.save.mockResolvedValue(savedCart);

  const result = await service.addItem(1, {
    productId: 1,
    quantity: 2,
  });

  expect(productsRepositoryMock.findOneBy).toHaveBeenCalledWith({
    id: 1,
    active: true,
  });

  expect(cartRepositoryMock.save).toHaveBeenCalledWith(cart);

  expect(cart.items).toHaveLength(1);
  expect(cart.items[0].product).toEqual(product);
  expect(cart.items[0].quantity).toBe(2);

  expect(result.total).toBe(3000);
  expect(result.items[0].subtotal).toBe(3000);
});

it('debería rechazar agregar un producto inexistente o inactivo', async () => {
  productsRepositoryMock.findOneBy.mockResolvedValue(null);

  await expect(
    service.addItem(1, {
      productId: 999,
      quantity: 2,
    }),
  ).rejects.toThrow('Product not found');

  expect(productsRepositoryMock.findOneBy).toHaveBeenCalledWith({
    id: 999,
    active: true,
  });

  expect(cartRepositoryMock.save).not.toHaveBeenCalled();
});


it('debería rechazar agregar una cantidad superior al stock disponible', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 5,
    active: true,
  };

  productsRepositoryMock.findOneBy.mockResolvedValue(product);

  await expect(
    service.addItem(1, {
      productId: 1,
      quantity: 8,
    }),
  ).rejects.toThrow('Insufficient stock');

  expect(productsRepositoryMock.findOneBy).toHaveBeenCalledWith({
    id: 1,
    active: true,
  });

  expect(cartRepositoryMock.findByUserId).not.toHaveBeenCalled();

  expect(cartRepositoryMock.save).not.toHaveBeenCalled();
});

it('debería aumentar la cantidad de un producto que ya está en el carrito', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 10,
    active: true,
  };

  const existingItem = {
    id: 20,
    product,
    quantity: 2,
  };

  const cart = {
    id: 5,
    user: { id: 1 },
    items: [existingItem],
  };

  productsRepositoryMock.findOneBy.mockResolvedValue(product);
  cartRepositoryMock.findByUserId.mockResolvedValue(cart);
  cartRepositoryMock.save.mockResolvedValue(cart);

  const result = await service.addItem(1, {
    productId: 1,
    quantity: 3,
  });

  expect(existingItem.quantity).toBe(5);

  expect(cartRepositoryMock.save).toHaveBeenCalledWith(cart);

  expect(result.items[0].quantity).toBe(5);

  expect(result.items[0].subtotal).toBe(7500);

  expect(result.total).toBe(7500);
});

it('debería rechazar aumentar la cantidad si se supera el stock disponible', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 5,
    active: true,
  };

  const existingItem = {
    id: 20,
    product,
    quantity: 3,
  };

  const cart = {
    id: 5,
    user: { id: 1 },
    items: [existingItem],
  };

  productsRepositoryMock.findOneBy.mockResolvedValue(product);
  cartRepositoryMock.findByUserId.mockResolvedValue(cart);

  await expect(
    service.addItem(1, {
      productId: 1,
      quantity: 3,
    }),
  ).rejects.toThrow('Insufficient stock');

  expect(existingItem.quantity).toBe(3);

  expect(cartRepositoryMock.save).not.toHaveBeenCalled();
});

it('debería actualizar correctamente la cantidad de un producto en el carrito', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 10,
    active: true,
  };

  const item = {
    id: 20,
    product,
    quantity: 2,
  };

  const cart = {
    id: 5,
    user: { id: 1 },
    items: [item],
  };

  cartRepositoryMock.findByUserId.mockResolvedValue(cart);
  cartRepositoryMock.save.mockResolvedValue(cart);

  const result = await service.updateQuantity(1, 20, 5);

  expect(item.quantity).toBe(5);

  expect(cartRepositoryMock.save).toHaveBeenCalledWith(cart);

  expect(result.items[0].quantity).toBe(5);

  expect(result.items[0].subtotal).toBe(7500);

  expect(result.total).toBe(7500);
});

it('debería rechazar actualizar un item que no existe en el carrito', async () => {
  const cart = {
    id: 5,
    user: { id: 1 },
    items: [],
  };

  cartRepositoryMock.findByUserId.mockResolvedValue(cart);

  await expect(
    service.updateQuantity(1, 999, 3),
  ).rejects.toThrow('Item not found in cart');

  expect(cartRepositoryMock.findByUserId).toHaveBeenCalledWith(1);

  expect(cartRepositoryMock.save).not.toHaveBeenCalled();
});

it('debería rechazar una cantidad menor o igual a cero', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 10,
    active: true,
  };

  const item = {
    id: 20,
    product,
    quantity: 2,
  };

  const cart = {
    id: 5,
    user: { id: 1 },
    items: [item],
  };

  cartRepositoryMock.findByUserId.mockResolvedValue(cart);

  await expect(
    service.updateQuantity(1, 20, 0),
  ).rejects.toThrow('Quantity must be greater than zero');

  await expect(
    service.updateQuantity(1, 20, -3),
  ).rejects.toThrow('Quantity must be greater than zero');

  expect(item.quantity).toBe(2);

  expect(cartRepositoryMock.save).not.toHaveBeenCalled();
});

it('debería rechazar actualizar la cantidad de un producto inactivo', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 10,
    active: false,
  };

  const item = {
    id: 20,
    product,
    quantity: 2,
  };

  const cart = {
    id: 5,
    user: { id: 1 },
    items: [item],
  };

  cartRepositoryMock.findByUserId.mockResolvedValue(cart);

  await expect(
    service.updateQuantity(1, 20, 5),
  ).rejects.toThrow('Product is no longer available');

  expect(item.quantity).toBe(2);

  expect(cartRepositoryMock.save).not.toHaveBeenCalled();
});

it('debería rechazar actualizar la cantidad si supera el stock disponible', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 5,
    active: true,
  };

  const item = {
    id: 20,
    product,
    quantity: 2,
  };

  const cart = {
    id: 5,
    user: { id: 1 },
    items: [item],
  };

  cartRepositoryMock.findByUserId.mockResolvedValue(cart);

  await expect(
    service.updateQuantity(1, 20, 6),
  ).rejects.toThrow('Insufficient stock');

  expect(item.quantity).toBe(2);

  expect(cartRepositoryMock.save).not.toHaveBeenCalled();
});

it('debería eliminar correctamente un item del carrito', async () => {
  const product1 = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 10,
    active: true,
  };

  const product2 = {
    id: 2,
    name: 'Correa',
    price: 2000,
    stock: 10,
    active: true,
  };

  const item1 = {
    id: 20,
    product: product1,
    quantity: 2,
  };

  const item2 = {
    id: 21,
    product: product2,
    quantity: 1,
  };

  const cart = {
    id: 5,
    user: { id: 1 },
    items: [item1, item2],
  };

  cartRepositoryMock.findByUserId.mockResolvedValue(cart);
  cartRepositoryMock.save.mockResolvedValue(cart);

  const result = await service.removeItem(1, 20);

  expect(cart.items).toHaveLength(1);

  expect(cart.items[0].id).toBe(21);

  expect(cartRepositoryMock.save).toHaveBeenCalledWith(cart);

  expect(result.items).toHaveLength(1);

  expect(result.items[0].product.id).toBe(2);

  expect(result.items[0].subtotal).toBe(2000);

  expect(result.total).toBe(2000);
});

it('debería mantener el carrito sin cambios si el item a eliminar no existe', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    price: 1500,
    stock: 10,
    active: true,
  };

  const item = {
    id: 20,
    product,
    quantity: 2,
  };

  const cart = {
    id: 5,
    user: { id: 1 },
    items: [item],
  };

  cartRepositoryMock.findByUserId.mockResolvedValue(cart);
  cartRepositoryMock.save.mockResolvedValue(cart);

  const result = await service.removeItem(1, 999);

  expect(cart.items).toHaveLength(1);

  expect(cart.items[0].id).toBe(20);

  expect(cartRepositoryMock.save).toHaveBeenCalledWith(cart);

  expect(result.items).toHaveLength(1);

  expect(result.items[0].product.id).toBe(1);

  expect(result.items[0].quantity).toBe(2);

  expect(result.total).toBe(3000);
});
});