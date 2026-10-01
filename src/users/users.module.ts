import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, AdminBootstrapService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
