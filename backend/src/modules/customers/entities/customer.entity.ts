import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { CustomerAddress } from './customer-address.entity';

@Entity('customers')
@Index(['storeId', 'email'], { unique: true })
export class Customer extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  @Column({ length: 200 })
  fullName: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  documentId?: string | null;

  @OneToMany(() => CustomerAddress, (address) => address.customer)
  addresses?: CustomerAddress[];
}
