import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Este guard corre DESPUES del JwtAuthGuard (por eso siempre se usan juntos:
// @UseGuards(JwtAuthGuard, RolesGuard)).
// Compara el rol del usuario autenticado (request.user.rol, seteado por JwtStrategy)
// contra los roles permitidos que definimos con @Roles(...) en el controller.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true; // la ruta no exige un rol especifico
    }

    const { user } = context.switchToHttp().getRequest();
    const tienePermiso = rolesRequeridos.includes(user?.rol);

    if (!tienePermiso) {
      throw new ForbiddenException('No tenes permisos para realizar esta accion');
    }
    return true;
  }
}
