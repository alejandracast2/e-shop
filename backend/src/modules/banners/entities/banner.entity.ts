import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

@Entity('banners')
@Index(['storeId', 'position'])
@Index(['tenantId', 'storeId', 'isActive'])
export class Banner extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text', nullable: true })
  subtitle?: string | null;

  @Column({ type: 'varchar', length: 2048 })
  imageUrl: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  mobileImageUrl?: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ctaLabel?: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  ctaUrl?: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  altText?: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt?: Date | null;
}
