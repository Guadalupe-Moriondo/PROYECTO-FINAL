import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn(),
  };

  const jwtServiceMock = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería iniciar sesión correctamente con credenciales válidas', async () => {
  const user = {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan@email.com',
    passwordHash: 'hash-de-la-password',
    role: 'customer',
  };

  usersServiceMock.findByEmail.mockResolvedValue(user);

  (bcrypt.compare as jest.Mock).mockResolvedValue(true);

  jwtServiceMock.sign.mockReturnValue('token-jwt-falso');

  const result = await service.login({
    email: 'juan@email.com',
    password: '123456',
  });

  expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
    'juan@email.com',
  );

  expect(bcrypt.compare).toHaveBeenCalledWith(
    '123456',
    'hash-de-la-password',
  );

  expect(jwtServiceMock.sign).toHaveBeenCalledWith({
    sub: 1,
    email: 'juan@email.com',
    role: 'customer',
  });

  expect(result).toEqual({
    access_token: 'token-jwt-falso',
    user: {
      id: 1,
      name: 'Juan Pérez',
      email: 'juan@email.com',
      role: 'customer',
    },
  });
});

it('debería rechazar el login si el email no existe', async () => {
  usersServiceMock.findByEmail.mockResolvedValue(null);

  try {
    await service.login({
      email: 'noexiste@email.com',
      password: '123456',
    });

    fail('Se esperaba una UnauthorizedException');
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedException);
    if (error instanceof UnauthorizedException) {
      expect(error.message).toBe('Credenciales inválidas');
    }
  }

  expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
    'noexiste@email.com',
  );
});

it('debería rechazar el login si la contraseña es incorrecta', async () => {
  const user = {
    id: 1,
    name: 'Juan',
    email: 'juan@email.com',
    passwordHash: 'hash-falso',
    role: 'CUSTOMER',
  };

  usersServiceMock.findByEmail.mockResolvedValue(user);

  (bcrypt.compare as jest.Mock).mockResolvedValue(false);

  try {
    await service.login({
      email: 'juan@email.com',
      password: 'contraseña-incorrecta',
    });

    fail('Se esperaba una UnauthorizedException');
  } catch (error) {
    expect(error).toBeInstanceOf(UnauthorizedException);
    if (error instanceof UnauthorizedException) {
      expect(error.message).toBe('Credenciales inválidas');
    }
  }

  expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
    'juan@email.com',
  );

  expect(bcrypt.compare).toHaveBeenCalledWith(
    'contraseña-incorrecta',
    'hash-falso',
  );
});

it('debería generar el JWT con el payload correcto', async () => {
  const user = {
    id: 5,
    name: 'María',
    email: 'maria@email.com',
    passwordHash: 'hash-falso',
    role: 'CUSTOMER',
  };

  usersServiceMock.findByEmail.mockResolvedValue(user);

  (bcrypt.compare as jest.Mock).mockResolvedValue(true);

  jwtServiceMock.sign.mockReturnValue('token-jwt');

  const result = await service.login({
    email: 'maria@email.com',
    password: '123456',
  });

  expect(jwtServiceMock.sign).toHaveBeenCalledWith({
    sub: 5,
    email: 'maria@email.com',
    role: 'CUSTOMER',
  });

  expect(result.access_token).toBe('token-jwt');
});

it('no debería devolver el passwordHash del usuario', async () => {
  const user = {
    id: 10,
    name: 'Pedro',
    email: 'pedro@email.com',
    passwordHash: 'hash-super-secreto',
    role: 'CUSTOMER',
  };

  usersServiceMock.findByEmail.mockResolvedValue(user);

  (bcrypt.compare as jest.Mock).mockResolvedValue(true);

  jwtServiceMock.sign.mockReturnValue('token-jwt');

  const result = await service.login({
    email: 'pedro@email.com',
    password: '123456',
  });

  expect(result.user).toEqual({
    id: 10,
    name: 'Pedro',
    email: 'pedro@email.com',
    role: 'CUSTOMER',
  });

  expect(result.user).not.toHaveProperty('passwordHash');
});
});