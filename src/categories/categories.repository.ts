import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Category } from './entities/category.entity';

// Este es el patron de "repositorio propio" que pediste.
// En vez de usar el Repository<Categoria> generico de TypeORM directamente
// en el service, creamos nuestra propia clase que EXTIENDE Repository<Categoria>.
//
// Ventaja: si mañana necesitas una consulta compleja y reutilizable
// (ej: "categorias que tienen al menos un producto con stock"),
// la escribis aca como un metodo mas, y la llamas desde el service
// como si fuera un metodo nativo (this.categoriasRepository.miMetodo()).
@Injectable()
export class CategoriesRepository extends Repository<Category> {
  constructor(private dataSource: DataSource) {
    // super() inicializa el Repository base indicandole:
    // 1) sobre que entidad trabaja (Categoria)
    // 2) que EntityManager usar (el del DataSource principal de la app)
    super(Category, dataSource.createEntityManager());
  }

  // Ejemplo de metodo custom: traer categorias junto con la cantidad
  // de productos que tiene cada una (util para el panel de admin)
  async findWithProductCount() {
    // `productCount` ahora es un @VirtualColumn en la entidad Category,
    // asi que se calcula automaticamente al traer las categorias.
    return this.createQueryBuilder('category')
     .orderBy('category.name', 'ASC')
     .getMany();
  }

  findAllPaginated(page: number, limit: number) {
    return this.findAndCount({
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
