import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Tenant } from './tenant.entity';
import { StoreSettings } from './store-settings.entity';

export type StoreStatus = 'active' | 'inactive';

@Entity('stores')
export class Store extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.stores, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 120 })
  slug: string;

  @Column({ type: 'varchar', length: 24, default: 'active' })
  status: StoreStatus;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  addressJson?: Record<string, unknown> | null;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({ length: 64, default: 'UTC' })
  timezone: string;

  @OneToOne(() => StoreSettings, (settings) => settings.store)
  settings?: StoreSettings;
}
