import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger, ValidationPipe} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

// @Catch() sin argumentos = este filtro atrapa TODAS las excepciones
// que se lancen en cualquier controller/service/guard de la app,
// sin importar el tipo (HttpException de Nest, un error de TypeORM,
// un error de JS comun, lo que sea).
@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string | string[];

    if (exception instanceof HttpException) {
      // Caso esperado: vos mismo lanzaste NotFoundException,
      // BadRequestException, UnauthorizedException, etc.
      // Respetamos el status y el mensaje que ya definiste ahi.
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // class-validator (los DTOs) devuelve el mensaje como un ARRAY
      // de strings (uno por cada campo invalido); las excepciones
      // simples devuelven un string. Contemplamos los dos casos.
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || 'Unexpected error';
    } else {
      // Caso NO esperado: un error de conexion a MySQL, un bug sin
      // querer, cualquier cosa que vos no controlaste explicitamente.
      // Nunca devolvemos el mensaje interno real hacia afuera (podria
      // filtrar nombres de tablas, columnas, fragmentos de SQL, etc.)
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An internal error occurred. Please try again later.';

      // Pero SI lo registramos completo en el log del servidor,
      // porque ahi es donde vos (el desarrollador) lo necesitas para debuggear.
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Formato UNICO y consistente para cualquier error de la API,
    // sin importar de donde haya salido.
    response.status(statusCode).json({
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

async function bootstrap() {
  // Usamos NestExpressApplication (en vez del tipo generico) porque
  // necesitamos el metodo useStaticAssets, que solo expone la variante
  // de Express (Nest tambien soporta Fastify, con otra API para esto).
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Habilita CORS para que el frontend (Vue.js) pueda consumir la API
  // desde otro origen (otro puerto/dominio) durante el desarrollo.
  app.enableCors();
  
  // Sirve la carpeta /uploads como archivos estaticos: cualquier imagen
  // guardada ahi queda accesible via http://localhost:3000/uploads/...
  // Esto es lo que hace que la "imagenUrl" que guardamos en la BD
  // (ej: /uploads/productos/uuid.jpg) funcione como una URL real.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
  prefix: '/uploads/',
});

  // ValidationPipe global: valida automaticamente todos los DTOs marcados
  // con class-validator antes de que lleguen al controller.
  // whitelist: elimina propiedades que no esten definidas en el DTO (seguridad)
  // forbidNonWhitelisted: rechaza la petición si mandan campos de más
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // convierte automaticamente tipos (ej: string "5" -> number 5)
    }),
  );

  // Filtro global de excepciones: intercepta CUALQUIER error lanzado en
  // toda la app y le da un formato de respuesta consistente, sin
  // exponer detalles internos (ej: de MySQL) en errores no controlados.
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
bootstrap();
