import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { PaymentIntent } from './payment-intent.entity';
import { FileEntity } from '../../catalog/entities/file.entity';

@Entity('payment_proofs')
export class PaymentProof extends BaseEntity {
  @Column({ type: 'uuid' })
  paymentIntentId: string;

  @Column({ type: 'uuid', nullable: true })
  fileId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  submittedByCustomerId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadataJson?: Record<string, unknown> | null;

  @ManyToOne(() => PaymentIntent, { onDelete: 'CASCADE' })
  paymentIntent: PaymentIntent;

  @ManyToOne(() => FileEntity, { onDelete: 'SET NULL', nullable: true })
  file?: FileEntity | null;
}
