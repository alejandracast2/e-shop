import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { AttributeDefinition } from './attribute-definition.entity';

@Entity('attribute_options')
@Index(['attributeDefinitionId', 'value'], { unique: true })
export class AttributeOption extends BaseEntity {
  @Column({ type: 'uuid' })
  attributeDefinitionId: string;

  @ManyToOne(() => AttributeDefinition, (definition) => definition.options, {
    onDelete: 'CASCADE',
  })
  attributeDefinition: AttributeDefinition;

  @Column({ length: 160 })
  value: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
