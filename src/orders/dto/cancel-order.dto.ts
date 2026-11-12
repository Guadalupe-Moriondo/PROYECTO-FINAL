import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'El motivo no puede superar los 255 caracteres.' })
  reason?: string;
}