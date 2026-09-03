import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from '../users/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    // Importante: el mensaje de error es el MISMO tanto si el email no existe
    // como si la contraseña es incorrecta. Esto evita que un atacante
    // pueda deducir que emails estan registrados (enumeration attack).
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // El "payload" es la informacion que va DENTRO del token (no sensible,
    // porque un JWT se puede decodificar facilmente, solo no se puede FALSIFICAR
    // sin conocer el JWT_SECRET)
    const payload = { sub: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion};

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, owner: user.owner },
    };
  }
}
