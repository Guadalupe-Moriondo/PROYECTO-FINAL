import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { UserRole } from './entities/user.entity';

const SALT_ROUNDS = 10;

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

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL and/or ADMIN_SEED_PASSWORD not configured: automatic admin creation skipped.',
      );
      return;
    }

    const existing = await this.usersRepository.findByEmail(email);

    if (existing) {
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