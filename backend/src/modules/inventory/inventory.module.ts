import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryLevel } from './entities/inventory-level.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryReservation } from './entities/inventory-reservation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Warehouse,
      InventoryLevel,
      InventoryMovement,
      InventoryReservation,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
