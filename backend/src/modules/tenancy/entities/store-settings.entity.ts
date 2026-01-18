import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Store } from './store.entity';

@Entity('store_settings')
export class StoreSettings extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  storeId: string;

  @OneToOne(() => Store, (store) => store.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column({ type: 'jsonb', nullable: true })
  brandingJson?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  checkoutSettingsJson?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  paymentSettingsJson?: Record<string, unknown> | null;
}
