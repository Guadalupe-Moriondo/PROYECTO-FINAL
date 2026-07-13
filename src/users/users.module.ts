import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  controllers: [UsersController],
  // AdminBootstrapService se registra como provider comun: Nest detecta
  // que implementa OnApplicationBootstrap y llama a su metodo solo,
  // no hace falta ninguna configuracion extra para "activarlo".
  providers: [UsersService, UsersRepository, AdminBootstrapService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
