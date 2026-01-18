import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

@Entity('payment_methods')
@Index(['storeId', 'type'], { unique: true })
export class PaymentMethod extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ length: 40 })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  configJson?: Record<string, unknown> | null;

  @Column({ default: true })
  isActive: boolean;
}
