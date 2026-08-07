import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { UserRole } from './entities/user.entity';

const SALT_ROUNDS = 10;

// OnApplicationBootstrap es un "lifecycle hook" de Nest: el metodo
// onApplicationBootstrap() se ejecuta automaticamente UNA VEZ, apenas
// termina de levantar toda la aplicacion (todos los modulos ya
// inicializados, conexion a la BD ya lista). No hace falta llamarlo
// desde ningun lado: Nest lo detecta solo porque la clase implementa
// esta interfaz y esta registrada como provider.
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_SEED_PASSWORD');
    const name = this.configService.get<string>('ADMIN_SEED_NAME') || 'Administrador';

    // Si no completaste estas variables en el .env, simplemente no hacemos
    // nada (no rompemos el arranque del servidor por esto)
    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL and/or ADMIN_SEED_PASSWORD not configured: automatic admin creation skipped.',
      );
      return;
    }

    const existing = await this.usersRepository.findByEmail(email);

    if (existing) {
      // Si ya existe pero todavia no es admin (ej: se registro como
      // cliente antes de que vos decidieras que sea el admin), lo ascendemos.
      // Si ya es admin, no hacemos nada: esto es lo que permite que el
      // hook corra en CADA arranque sin generar duplicados ni pisar datos.
      if (
          existing.role !== UserRole.ADMIN ||
          !existing.owner
      ) {
          existing.role = UserRole.ADMIN;
          existing.owner = true;

          await this.usersRepository.save(existing);

          this.logger.log(`User ${email} promoted to owner admin.`);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = this.usersRepository.create({
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      owner: true,
    });
    await this.usersRepository.save(admin);
    this.logger.log(`Admin user automatically created: ${email}`);
  }
}