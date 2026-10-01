import { Injectable,UnauthorizedException, } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly usersService: UsersService,) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está definido en las variables de entorno');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, 
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: number; email: string; role: string; tokenVersion: number }) {
    const user =
      await this.usersService.findByEmail(
        payload.email,
      );

    if (!user) {
      throw new UnauthorizedException(
        'Usuario no encontrado',
      );
    }

    if (
      user.tokenVersion !== payload.tokenVersion
    ) {

      throw new UnauthorizedException(
        'La sesión ya no es válida.',
      );
    }

    if (user.role !== payload.role) {

      throw new UnauthorizedException(
        'El rol del usuario ha cambiado.',
      );
    }
    return { 
      id: user.id,
      email: user.email,
      role: user.role,
      owner: user.owner, 
    };
  }
}
