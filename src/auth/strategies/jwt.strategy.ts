import { Injectable,UnauthorizedException, } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
// Esta "estrategia" le enseña a Passport COMO validar un JWT:
// de donde sacarlo (header Authorization: Bearer <token>) y con que
// secreto verificar la firma.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly usersService: UsersService,) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está definido en las variables de entorno');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // rechaza tokens vencidos automaticamente
      secretOrKey: jwtSecret,
    });
  }

  // Esto se ejecuta automaticamente DESPUES de que Passport verifica
  // que la firma del token es valida. El "payload" es lo que guardamos
  // al firmar el token en auth.service.ts (login).
  // Lo que retornamos aca queda disponible como `request.user` en los controllers.
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


    // Verifica que el token siga perteneciendo
    // a la versión actual de la sesión.

    if (
      user.tokenVersion !== payload.tokenVersion
    ) {

      throw new UnauthorizedException(
        'La sesión ya no es válida.',
      );
    }


    // También verificamos que el rol del JWT
    // siga coincidiendo con el rol actual.

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
