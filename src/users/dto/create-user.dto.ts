import { IsEmail, IsNotEmpty, IsString, MinLength,Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio.' })
  @Matches(/^[0-9]{8,15}$/, {message: 'El teléfono debe tener entre 8 y 15 dígitos, sin espacios ni guiones.',})
  phone!: string;
}
