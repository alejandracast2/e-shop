import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Warehouse } from './warehouse.entity';

export type InventoryMovementType = 'in' | 'out' | 'adjust' | 'reserve' | 'release';

@Entity('inventory_movements')
export class InventoryMovement extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @Column({ type: 'uuid' })
  variantId: string;

  @Column({ type: 'varchar', length: 16 })
  type: InventoryMovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  referenceType?: string | null;

  @Column({ type: 'uuid', nullable: true })
  referenceId?: string | null;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE' })
  warehouse: Warehouse;
}
