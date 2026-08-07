import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/pagination';
import{OrderHistoryQueryDto} from './dto/history-query.dto';
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(RolesGuard)
  @Roles('customer')
  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCart(req.user.id, dto);
  }

  // El cliente ve solo SUS pedidos. GET /pedidos/mios?pagina=1&limite=10
  @Get('mine')
  myOrders(@Req() req: any, @Query() pagination: PaginationQueryDto) {
    return this.ordersService.findByUser(req.user.id, pagination);
  }

  // El admin ve TODOS los pedidos (requerimiento funcional 10)
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.ordersService.findAll(pagination);
  }

  @Get('/statistics')
  @Roles('admin')
  getStatistics() {
    return this.ordersService.getStatistics();
  }

  // Historial de pedidos entregados (requerimiento: los pedidos entregados
  // desaparecen de "Pedidos" y quedan guardados aca). "month" es opcional,
  // formato "YYYY-MM" (lo manda el <input type="month"> del frontend).
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('/history')
  history(@Query() query: OrderHistoryQueryDto) {
    return this.ordersService.findDelivered(query, query.month,query.year);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id/notify')
  notifyCustomer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { method: 'whatsapp' | 'email' },
  ) {
    return this.ordersService.notifyCustomer(id, body.method);
  }

  
}