import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Customer } from './customer.entity';

@Entity('customer_addresses')
export class CustomerAddress extends BaseEntity {
  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  label?: string | null;

  @Column({ length: 200 })
  address1: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address2?: string | null;

  @Column({ length: 80 })
  city: string;

  @Column({ length: 80 })
  state: string;

  @Column({ length: 20 })
  zip: string;

  @Column({ length: 80 })
  country: string;

  @Column({ type: 'jsonb', nullable: true })
  extraJson?: Record<string, unknown> | null;

  @Column({ default: false })
  isDefault: boolean;

  @ManyToOne(() => Customer, (customer) => customer.addresses, { onDelete: 'CASCADE' })
  customer: Customer;
}
