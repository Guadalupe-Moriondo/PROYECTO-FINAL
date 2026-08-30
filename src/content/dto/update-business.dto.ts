import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() city?: string;
  @IsString() @IsOptional() province?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() morningOpen?: string;
  @IsString() @IsOptional() morningClose?: string;
  @IsString() @IsOptional() afternoonOpen?: string;
  @IsString() @IsOptional() afternoonClose?: string;
  @IsString() @IsOptional() saturdayOpen?: string;
  @IsString() @IsOptional() saturdayClose?: string;
  @IsString() @IsOptional() whatsapp?: string;
  @IsString() @IsOptional() instagram?: string;
  @IsString() @IsOptional() facebook?: string;
  @IsString() @IsOptional() email?: string;
}
