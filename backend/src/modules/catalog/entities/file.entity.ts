import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

@Entity('files')
export class FileEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ length: 32, default: 'local' })
  provider: string;

  @Column({ length: 400 })
  path: string;

  @Column({ type: 'varchar', length: 600, nullable: true })
  url?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  mimeType?: string | null;

  @Column({ type: 'bigint', nullable: true })
  sizeBytes?: number | null;
}
