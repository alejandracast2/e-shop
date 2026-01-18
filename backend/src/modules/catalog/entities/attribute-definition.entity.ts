import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { AttributeOption } from './attribute-option.entity';

export type AttributeType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multiselect';

@Entity('attribute_definitions')
@Index(['storeId', 'code'], { unique: true })
export class AttributeDefinition extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ length: 80 })
  code: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 24 })
  type: AttributeType;

  @Column({ default: false })
  isVariantAxis: boolean;

  @Column({ default: false })
  isFilterable: boolean;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ type: 'varchar', length: 24, nullable: true })
  unit?: string | null;

  @OneToMany(() => AttributeOption, (option) => option.attributeDefinition)
  options?: AttributeOption[];
}
