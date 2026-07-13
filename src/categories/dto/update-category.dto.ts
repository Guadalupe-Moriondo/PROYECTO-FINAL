import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

// PartialType toma el DTO de creacion y hace que TODOS sus campos
// sean opcionales. Asi no repetimos las mismas validaciones para el update.
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
