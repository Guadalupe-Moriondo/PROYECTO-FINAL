import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';

@Module({
  controllers: [CategoriesController],
  // OJO: aca NO usamos TypeOrmModule.forFeature([Categoria]).
  // En su lugar, proveemos directamente nuestra clase de repositorio propio.
  // Nest se encarga de inyectar el DataSource en su constructor automaticamente
  // porque el DataSource ya fue registrado globalmente en TypeOrmModule.forRoot (app.module.ts)
  providers: [CategoriesService, CategoriesRepository],
  exports: [CategoriesRepository], // lo exportamos por si otro modulo (Productos) lo necesita
})
export class CategoriesModule {}
