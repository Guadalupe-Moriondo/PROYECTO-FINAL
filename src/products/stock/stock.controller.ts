import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards,Query, Req} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/pagination';
import { MovementFilterDto } from '../dto/movement-filter.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movements')
  register(@Body() dto: CreateMovementDto, @Req() req: any) {
    return this.stockService.registerMovement(dto, req.user.id);
  }

  @Get('movements')
  history(@Query() filters: MovementFilterDto) {
    return this.stockService.history(filters);
  }

  @Get('movements/:productId')
  historyByProduct(
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.stockService.historyByProduct(productId);
  }

  @Get('alerts')
  alerts(@Query() pagination: PaginationQueryDto) {
    return this.stockService.lowStockAlerts(pagination);
  }
}
