import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { BusinessService } from './business.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // Publico: el frontend lo consume para mostrar telefono, horarios, etc.
  @Get()
  get() {
    return this.businessService.get();
  }

  // Solo el admin puede editar estos datos
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put()
  update(@Body() dto: UpdateBusinessDto) {
    return this.businessService.update(dto);
  }
}
