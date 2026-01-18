import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Warehouse } from './warehouse.entity';

@Entity('inventory_reservations')
export class InventoryReservation extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @Column({ type: 'uuid' })
  variantId: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  cartId?: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
  warehouse: Warehouse;
}
