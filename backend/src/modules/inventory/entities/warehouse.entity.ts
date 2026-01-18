import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { InventoryLevel } from './inventory-level.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  addressJson?: Record<string, unknown> | null;

  @OneToMany(() => InventoryLevel, (level) => level.warehouse)
  levels?: InventoryLevel[];
}
