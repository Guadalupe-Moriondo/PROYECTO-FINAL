import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    // forRootAsync porque necesitamos leer el JWT_SECRET desde .env
    // a traves de ConfigService, en vez de hardcodearlo
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('JWT_SECRET no está definido en las variables de entorno');
        }
        return {
          secret: jwtSecret,
          // `expiresIn` ahora requiere el tipo `StringValue` de la librería `ms`
          // (ej: '8h', '15m', '7d'), por eso el cast explícito.
          signOptions: {
            expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '8h') as import('ms').StringValue,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
