import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './entities/user.entity';

const SALT_ROUNDS = 10; // costo del hash: mas alto = mas seguro pero mas lento

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with that email is already registered');
    }

    // bcrypt.hash genera un hash irreversible de la contraseña.
    // Nunca comparamos ni guardamos la contraseña en texto plano.
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });
    const saved = await this.usersRepository.save(user);

    // Nunca devolvemos el hash en la respuesta HTTP
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash: _, ...result } = user;
    return result;
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  // Le permite a un admin ascender/degradar el rol de otro usuario.
  // No aceptamos el rol en el registro publico (create()) a proposito:
  // si lo hicieramos, cualquiera podria registrarse como admin mandando
  // el campo correcto en el body. Este es el UNICO camino habilitado
  // para cambiar un rol, y esta protegido por RolesGuard en el controller.
  async updateRole(id: number, newRole: UserRole, requestedBy: { id: number }) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    if (user.id === requestedBy.id && newRole !== UserRole.ADMIN) {
      // Evita que un admin se auto-degrade por error y se quede afuera
      // del panel sin querer (y sin que quede ya ningun otro admin activo)
      throw new ConflictException('You cannot remove your own administrator role');
    }

    user.role = newRole;
    const saved = await this.usersRepository.save(user);
    const { passwordHash: _, ...result } = saved;
    return result;
  }
}
