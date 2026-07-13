import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';

import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [
    // isGlobal:true permite usar ConfigService en cualquier modulo
    // sin tener que importar ConfigModule en cada uno
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),

    // forRootAsync porque necesitamos leer las variables de entorno
    // (via ConfigService) ANTES de poder conectar con la base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        // entities: busca automaticamente todas las clases @Entity() del proyecto
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // Carpeta de migraciones. migrationsRun:true hace que, cada vez que
        // arranca el servidor, se apliquen automaticamente las migraciones
        // pendientes (util en desarrollo; en produccion muchos equipos
        // prefieren correrlas a mano antes del deploy, por control).
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
        // synchronize SIEMPRE en false cuando se usan migraciones: si esta
        // en true, TypeORM intenta sincronizar el esquema por su cuenta
        // ademas de aplicar las migraciones, y los cambios chocan entre si.
        synchronize: false,
      }),
    }),

    // Modulos de dominio de la aplicacion
    CategoriesModule,
    ProductsModule, // incluye tambien el manejo de stock (fusionado)
    UsersModule,
    AuthModule,
    CartModule,
    OrdersModule,
    ContentModule, // incluye empresa + consultas (fusionados)
  ],
})
export class AppModule {}
