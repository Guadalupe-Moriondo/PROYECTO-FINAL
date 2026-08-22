import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductFilterDto } from './dto/product-filter.dto';

@Injectable()
export class ProductsRepository extends Repository<Product> {
  constructor(private dataSource: DataSource) {
    super(Product, dataSource.createEntityManager());
  }

  // Metodo custom para el buscador con filtros (objetivo especifico del proyecto).
  // Usamos QueryBuilder porque los filtros son dinamicos: el usuario puede
  // combinar cualquier cantidad de ellos, y con el Repository generico
  // (find()) seria muy dificil armar esa consulta condicional.
  async searchWithFilters(filters: ProductFilterDto): Promise<[Product[], number]> {
    const query = this.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.active = :active', { active: true });

      if (filters.name) {
        const search = filters.name
          .trim()
          .toLowerCase()
          .replace(/s$/, '');

        query.andWhere(
        `(
          LOWER(product.name) LIKE :search
          OR LOWER(product.code) LIKE :search
          OR LOWER(product.description) LIKE :search
          OR LOWER(category.name) LIKE :search
        )`,
        {
          search: `%${search}%`,
        },
      );
    }


    if (filters.categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.available) {
      query.andWhere('product.stock > 0');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    query
      .orderBy('product.id', 'DESC')
      .skip((page - 1) * limit) // cuantos registros "saltear" antes de empezar a traer
      .take(limit); // cuantos traer despues de eso

    // getManyAndCount() devuelve DOS cosas en un solo viaje a la BD:
    // los registros de ESTA pagina, y el total de registros que matchean
    // el filtro (sin paginar). Ese total es el que necesitamos para
    // calcular cuantas paginas hay en total.
    return query.getManyAndCount();
  }

  // Listado simple paginado, sin filtros (usado por GET /productos)
  async findAllPaginated(page: number, limit: number): Promise<[Product[], number]> {
    return this.findAndCount({
      where: { active: true },
      relations: {
        category: true
      },
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  // Metodo custom para el requerimiento de "notificaciones de stock minimo"
  async findWithLowStock(): Promise<Product[]> {
    return this.createQueryBuilder('product')
      .where('product.stock <= product.min_stock')
      .andWhere('product.active = true')
      .getMany();
  }

  // Version paginada, usada por GET /stock/alerts (la vista de Gestion de Stock)
  async findWithLowStockPaginated(page: number, limit: number): Promise<[Product[], number]> {
    return this.createQueryBuilder('product')
      .where('product.stock <= product.min_stock')
      .andWhere('product.active = true')
      .orderBy('product.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  // Util para descontar/sumar stock de forma atomica (lo usa el modulo de Stock)
  async adjustStock(productId: number, quantity: number): Promise<void> {
    // increment() genera un UPDATE ... SET stock = stock + cantidad
    // Es mas seguro que leer, sumar en JS y volver a guardar (evita condiciones de carrera)
    await this.increment({ id: productId }, 'stock', quantity);
  }

  
}
