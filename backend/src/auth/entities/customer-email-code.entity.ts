import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

export type CustomerEmailCodePurpose = 'login' | 'password_reset';

@Entity('customer_email_codes')
@Index(['email', 'purpose', 'storeId', 'createdAt'])
export class CustomerEmailCode extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 24 })
  purpose: CustomerEmailCodePurpose;

  @Column({ type: 'varchar', length: 120 })
  codeHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt?: Date | null;

  @Column({ type: 'int', default: 0 })
  attempts: number;
}
