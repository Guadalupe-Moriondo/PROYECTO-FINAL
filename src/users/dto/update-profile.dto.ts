import { IsOptional, IsString, IsEmail, Matches} from 'class-validator';

export class UpdateProfileDto {

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{8,15}$/, { message: 'El teléfono debe tener entre 8 y 15 dígitos, sin espacios ni guiones.' })
  phone?: string;
}