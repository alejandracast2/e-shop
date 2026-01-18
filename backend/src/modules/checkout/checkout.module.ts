import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { CartsModule } from '../carts/carts.module';
import { CustomersModule } from '../customers/customers.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckoutSession]),
    CartsModule,
    CustomersModule,
    OrdersModule,
    PaymentsModule,
    InventoryModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
