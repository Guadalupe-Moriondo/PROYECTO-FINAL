import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const SALT_ROUNDS = 10; // costo del hash: mas alto = mas seguro pero mas lento

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Correo electrónico inválido');
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
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const { passwordHash: _, ...result } = user;
    return result;
  }

 async findAll(page = 1, search = '',role = 'all') {

  const limit = 10;

  const query =
    this.usersRepository.createQueryBuilder('user');

  if (search) {

    query.andWhere(
      `
      user.name LIKE :search
      OR user.email LIKE :search
      `,
      {
        search: `%${search}%`,
      },
    );

  }
  if (role !== 'all') {
    query.andWhere(
      `
      user.role = :role
      `,
      {
        role,
      },
    );

  }

  const [items, total] =
    await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

  const totalUsers =
    await this.usersRepository.count();

  const totalAdmins =
    await this.usersRepository.count({
      where: {
        role: UserRole.ADMIN,
      },
    });

  const totalCustomers =
    await this.usersRepository.count({
      where: {
        role: UserRole.CUSTOMER,
      },
    });

  return {

    items: items.map(user => {

      const {
        passwordHash,
        ...safeUser
      } = user;

      return safeUser;

    }),

    total,

    page,

    limit,

    statistics: {
      totalUsers,
      totalAdmins,
      totalCustomers,
    },

  };

}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  // Le permite a un admin ascender/degradar el rol de otro usuario.
  // No aceptamos el rol en el registro publico (create()) a proposito:
  // si lo hicieramos, cualquiera podria registrarse como admin mandando
  // el campo correcto en el body. Este es el UNICO camino habilitado
  // para cambiar un rol, y esta protegido por RolesGuard en el controller.
  async updateRole(
  id: number,
  newRole: UserRole,
  requestedBy: { id: number; owner: boolean }
) {

    // Solo el administrador principal puede
    // cambiar roles.

  if (!requestedBy.owner) {
    throw new ConflictException(
      'Solo el administrador principal puede cambiar roles.',
    );
  }

  const user = await this.usersRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  if (user.owner) {
  throw new ConflictException(
    'No se puede modificar el rol del administrador principal.',
  );
}


  if (
    user.id === requestedBy.id &&
    newRole !== UserRole.ADMIN
  ) {
    throw new ConflictException(
      'No puedes quitarte tu propio rol de administrador.'
    );
  }


  if (
    user.role === UserRole.ADMIN &&
    newRole === UserRole.CUSTOMER
  ) {

    const admins = await this.usersRepository.count({
      where: {
        role: UserRole.ADMIN
      }
    });


    if (admins <= 1) {
      throw new ConflictException(
        'Debe existir al menos un administrador activo.'
      );
    }

  }

   // Guardamos el rol anterior.
  const wasAdmin = user.role === UserRole.ADMIN;

  // Actualizamos el rol.
  user.role = newRole;

  // Si pasa de admin a cliente,
  // invalidamos su sesión actual.

  if (
    wasAdmin &&
    newRole === UserRole.CUSTOMER
  ) {
    user.tokenVersion += 1;
  }
  
  const saved = await this.usersRepository.save(user);

  const { passwordHash, ...result } = saved;

  return result;
}

  async updateProfile(id: number, dto: UpdateProfileDto) {

  const user = await this.usersRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }


  if (dto.email && dto.email !== user.email) {

    const existing = await this.usersRepository.findByEmail(dto.email);

    if (existing && existing.id !== id) {
      throw new ConflictException('El correo ya está registrado');
    }
  }


  Object.assign(user, dto);

  const saved = await this.usersRepository.save(user);

  const { passwordHash: _, ...result } = saved;

  return result;
}

async changePassword(id: number, dto: ChangePasswordDto) {
  const user = await this.usersRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  const passwordMatches = await bcrypt.compare(
    dto.currentPassword,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new ConflictException('La contraseña actual es incorrecta');
  }

  // Verifica que la nueva contraseña no sea igual a la actual
  const samePassword = await bcrypt.compare(
    dto.newPassword,
    user.passwordHash,
  );

  if (samePassword) {
    throw new ConflictException(
      'La nueva contraseña debe ser diferente a la actual',
    );
  }

  user.passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

  await this.usersRepository.save(user);

  return {
    message: 'Contraseña actualizada correctamente',
  };
}

async remove(id: number) {

  const user = await this.usersRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }

  if (user.owner) {
    throw new ConflictException(
      'No se puede eliminar el administrador principal.',
    );
  }

  await this.usersRepository.remove(user);

  return {
    message: 'Usuario eliminado correctamente',
  };
}
}


