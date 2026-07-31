import { IsNotEmpty, IsOptional, IsString, MaxLength, IsIn} from 'class-validator';

// Los DTOs definen la "forma" de los datos que esperamos recibir
// en el body de la peticion HTTP, y class-validator los valida
// automaticamente gracias al ValidationPipe global que configuramos en main.ts
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['sembradoras', 'cosechadoras', 'otros'])
  machineType!: string;
}
