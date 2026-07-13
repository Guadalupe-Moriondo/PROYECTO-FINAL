import { registerAs } from '@nestjs/config';

// registerAs agrupa estas variables bajo la clave "database",
// asi despues se leen como configService.get('database.host'), etc.
// Esto evita tener variables de entorno sueltas por todos lados.
export default registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}));
