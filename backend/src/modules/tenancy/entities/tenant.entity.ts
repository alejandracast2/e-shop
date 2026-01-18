import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Store } from './store.entity';

export type TenantStatus = 'active' | 'suspended';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 24, default: 'active' })
  status: TenantStatus;

  @Column({ type: 'uuid', nullable: true })
  ownerUserId?: string | null;

  @OneToMany(() => Store, (store) => store.tenant)
  stores?: Store[];
}
