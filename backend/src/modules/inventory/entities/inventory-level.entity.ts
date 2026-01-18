import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Warehouse } from './warehouse.entity';
import { ProductVariant } from '../../catalog/entities/product-variant.entity';

@Entity('inventory_levels')
@Index(['warehouseId', 'variantId'], { unique: true })
export class InventoryLevel extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @Column({ type: 'uuid' })
  variantId: string;

  @Column({ type: 'int', default: 0 })
  onHand: number;

  @Column({ type: 'int', default: 0 })
  reserved: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.levels, { onDelete: 'CASCADE' })
  warehouse: Warehouse;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  variant: ProductVariant;
}
