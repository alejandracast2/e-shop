import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentProof } from './entities/payment-proof.entity';
import { FileEntity } from '../catalog/entities/file.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentMethod, PaymentIntent, PaymentProof, FileEntity]),
    OrdersModule,
    InventoryModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
