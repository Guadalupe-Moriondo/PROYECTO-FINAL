import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() whatsapp?: string;
  @IsString() @IsOptional() hours?: string;
  @IsString() @IsOptional() instagram?: string;
  @IsString() @IsOptional() facebook?: string;
}
