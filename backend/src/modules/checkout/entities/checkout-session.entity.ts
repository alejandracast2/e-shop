import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

export type CheckoutStatus =
  | 'started'
  | 'awaiting_payment'
  | 'completed'
  | 'expired';

@Entity('checkout_sessions')
export class CheckoutSession extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  cartId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string | null;

  @Column({ type: 'varchar', length: 24, default: 'started' })
  status: CheckoutStatus;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddressJson?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  billingAddressJson?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  totalsJson?: Record<string, number> | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  paymentMethod?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  idempotencyKey?: string | null;
}
