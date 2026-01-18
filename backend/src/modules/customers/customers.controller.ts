import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('tenant_owner', 'store_admin', 'store_staff')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  listCustomers() {
    return this.customersService.listCustomers();
  }

  @Get(':id')
  getCustomer(@Param('id') id: string) {
    return this.customersService.getCustomer(id);
  }

  @Post()
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.customersService.createCustomer(dto);
  }

  @Patch(':id')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.updateCustomer(id, dto);
  }
}
