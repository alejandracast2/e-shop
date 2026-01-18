import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('admin/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin', 'store_staff')
  listOrders(@Query('status') status?: string) {
    return this.ordersService.listOrders({ status });
  }

  @Get('admin/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin', 'store_staff')
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Patch('admin/orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_owner', 'store_admin')
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, dto);
  }

  @Get('storefront/orders/:orderNumber')
  getOrderByNumber(
    @Param('orderNumber', ParseIntPipe) orderNumber: number,
    @Query('email') email?: string,
  ) {
    return this.ordersService.getOrderByNumber(orderNumber, email);
  }
}
