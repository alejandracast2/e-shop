import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

@Entity('categories')
@Index(['storeId', 'slug'], { unique: true })
export class Category extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  parent?: Category | null;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 160 })
  slug: string;

  @Column({ type: 'varchar', length: 320, nullable: true })
  path?: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  imageUrl?: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
