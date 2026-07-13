import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Decorador custom que "adjunta" metadata a la ruta, ej: @Roles('admin')
// Despues el RolesGuard lee esa metadata para saber que rol se exige.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
