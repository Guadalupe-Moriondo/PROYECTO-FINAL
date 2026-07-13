import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Esta "estrategia" le enseña a Passport COMO validar un JWT:
// de donde sacarlo (header Authorization: Bearer <token>) y con que
// secreto verificar la firma.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
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
  async validate(payload: { sub: number; email: string; rol: string }) {
    return { id: payload.sub, email: payload.email, rol: payload.rol };
  }
}
