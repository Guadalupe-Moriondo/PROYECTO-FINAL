import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard = un "portero" que se ejecuta ANTES de entrar al controller.
// Este en particular delega en la estrategia 'jwt' que definimos arriba:
// si el token no es valido, corta la peticion con 401 automaticamente.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
