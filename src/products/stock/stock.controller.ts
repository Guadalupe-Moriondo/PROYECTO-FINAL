import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards,Query } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/pagination';

// Todo el modulo de stock es exclusivo del administrador
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movements')
  register(@Body() dto: CreateMovementDto) {
    return this.stockService.registerMovement(dto);
  }

  @Get('movements/:productId')
  history(@Param('productId', ParseIntPipe) productId: number) {
    return this.stockService.historyByProduct(productId);
  }

  @Get('alerts')
  alerts(@Query() pagination: PaginationQueryDto) {
    return this.stockService.lowStockAlerts(pagination);
  }
}
