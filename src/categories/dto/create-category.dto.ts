import { IsNotEmpty, IsOptional, IsString, MaxLength} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(100,{ message: 'El nombre no puede superar los 100 caracteres.' })
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
