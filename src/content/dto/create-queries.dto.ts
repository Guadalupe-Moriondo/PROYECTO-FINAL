import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { QueryType } from '../entities/queries.entity';

export class CreateQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(QueryType)
  @IsOptional()
  type?: QueryType;

  @IsString()
  @IsNotEmpty()
  message!: string;

  // Solo se manda si la consulta parte de la pagina de un producto puntual
  @IsInt()
  @IsOptional()
  productId?: number;
}
