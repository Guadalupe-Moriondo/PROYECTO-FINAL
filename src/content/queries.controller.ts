import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { QueriesService } from './queries.service';
import { CreateQueryDto } from './dto/create-queries.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('queries')
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  // Publico y sin login: cualquier visitante puede usar el "boton de contacto"
  @Post()
  create(@Body() dto: CreateQueryDto) {
    return this.queriesService.create(dto);
  }

  // A partir de aca, solo el admin gestiona las consultas recibidas
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.queriesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('pending')
  pending() {
    return this.queriesService.findPending();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id/answer')
  markAsAnswered(@Param('id', ParseIntPipe) id: number) {
    return this.queriesService.markAsAnswered(id);
  }
}
