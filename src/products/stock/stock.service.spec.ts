import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { StockRepository } from './stock.repository';
import { ProductsRepository } from '../products.repository';
import { MovementType } from '../entities/stock-movement.entity';


describe('StockService', () => {
  let service: StockService;

  const stockRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    findByProduct: jest.fn(),
  };

  const productsRepositoryMock = {
    findOneBy: jest.fn(),
    adjustStock: jest.fn(),
    findWithLowStockPaginated: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: StockRepository,
          useValue: stockRepositoryMock,
        },
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería registrar correctamente una entrada de stock', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    stock: 10,
  };

  const movement = {
    id: 1,
    product,
    type: MovementType.IN,
    quantity: 5,
    reason: 'Reposición de stock',
  };

  productsRepositoryMock.findOneBy.mockResolvedValue(product);

  productsRepositoryMock.adjustStock.mockResolvedValue(undefined);

  stockRepositoryMock.create.mockReturnValue(movement);

  stockRepositoryMock.save.mockResolvedValue(movement);

  const result = await service.registerMovement({
    productId: 1,
    type: MovementType.IN,
    quantity: 5,
    reason: 'Reposición de stock',
  });

  expect(productsRepositoryMock.findOneBy).toHaveBeenCalledWith({
    id: 1,
  });

  expect(productsRepositoryMock.adjustStock).toHaveBeenCalledWith(
    1,
    5,
  );

  expect(stockRepositoryMock.create).toHaveBeenCalledWith({
    product,
    type: MovementType.IN,
    quantity: 5,
    reason: 'Reposición de stock',
  });

  expect(stockRepositoryMock.save).toHaveBeenCalledWith(movement);

  expect(result).toBe(movement);
});

it('debería registrar correctamente una salida de stock', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    stock: 10,
  };

  const movement = {
    id: 2,
    product,
    type: MovementType.OUT,
    quantity: 3,
    reason: 'Venta',
  };

  productsRepositoryMock.findOneBy.mockResolvedValue(product);

  productsRepositoryMock.adjustStock.mockResolvedValue(undefined);

  stockRepositoryMock.create.mockReturnValue(movement);

  stockRepositoryMock.save.mockResolvedValue(movement);

  const result = await service.registerMovement({
    productId: 1,
    type: MovementType.OUT,
    quantity: 3,
    reason: 'Venta',
  });

  expect(productsRepositoryMock.findOneBy).toHaveBeenCalledWith({
    id: 1,
  });

  expect(productsRepositoryMock.adjustStock).toHaveBeenCalledWith(
    1,
    -3,
  );

  expect(stockRepositoryMock.create).toHaveBeenCalledWith({
    product,
    type: MovementType.OUT,
    quantity: 3,
    reason: 'Venta',
  });

  expect(stockRepositoryMock.save).toHaveBeenCalledWith(movement);

  expect(result).toBe(movement);
});

it('debería rechazar una salida si no hay stock suficiente', async () => {
  const product = {
    id: 1,
    name: 'Disco agrícola',
    stock: 3,
  };

  productsRepositoryMock.findOneBy.mockResolvedValue(product);

  await expect(
    service.registerMovement({
      productId: 1,
      type: MovementType.OUT,
      quantity: 5,
      reason: 'Venta',
    }),
  ).rejects.toThrow('Stock insuficiente.');

  expect(productsRepositoryMock.adjustStock).not.toHaveBeenCalled();

  expect(stockRepositoryMock.create).not.toHaveBeenCalled();

  expect(stockRepositoryMock.save).not.toHaveBeenCalled();
});

it('debería rechazar un movimiento si el producto no existe', async () => {
  productsRepositoryMock.findOneBy.mockResolvedValue(null);

  await expect(
    service.registerMovement({
      productId: 999,
      type: MovementType.IN,
      quantity: 5,
      reason: 'Reposición',
    }),
  ).rejects.toThrow('Producto no encontrado');

  expect(productsRepositoryMock.adjustStock).not.toHaveBeenCalled();

  expect(stockRepositoryMock.create).not.toHaveBeenCalled();

  expect(stockRepositoryMock.save).not.toHaveBeenCalled();
});

it('debería obtener correctamente el historial de movimientos de un producto', async () => {
  const movements = [
    {
      id: 1,
      product: { id: 1 },
      type: MovementType.IN,
      quantity: 10,
      reason: 'Reposición',
    },
    {
      id: 2,
      product: { id: 1 },
      type: MovementType.OUT,
      quantity: 3,
      reason: 'Venta',
    },
  ];

  stockRepositoryMock.findByProduct.mockResolvedValue(movements);

  const result = await service.historyByProduct(1);

  expect(stockRepositoryMock.findByProduct).toHaveBeenCalledWith(1);

  expect(result).toBe(movements);
});

it('debería obtener correctamente las alertas de stock bajo', async () => {
  const products = [
    {
      id: 1,
      name: 'Disco agrícola',
      stock: 2,
    },
    {
      id: 2,
      name: 'Correa',
      stock: 1,
    },
  ];

  productsRepositoryMock.findWithLowStockPaginated.mockResolvedValue([
    products,
    5,
  ]);

  const result = await service.lowStockAlerts({
    page: 2,
    limit: 2,
  });

  expect(
    productsRepositoryMock.findWithLowStockPaginated,
  ).toHaveBeenCalledWith(2, 2);

  expect(result).toEqual({
    data: products,
    total: 5,
    page: 2,
    totalPages: 3,
    });
});

it('debería usar paginación por defecto en las alertas de stock bajo', async () => {
  productsRepositoryMock.findWithLowStockPaginated.mockResolvedValue([
    [],
    0,
  ]);

  const result = await service.lowStockAlerts({});

  expect(
    productsRepositoryMock.findWithLowStockPaginated,
  ).toHaveBeenCalledWith(1, 10);

  expect(result).toEqual({
    data: [],
    total: 0,
    page: 1,
    totalPages: 0,
    });
});

});