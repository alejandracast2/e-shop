import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { AttributeDefinition } from './attribute-definition.entity';
import { AttributeOption } from './attribute-option.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('variant_attribute_values')
@Index(['variantId', 'attributeDefinitionId'], { unique: true })
export class VariantAttributeValue extends BaseEntity {
  @Column({ type: 'uuid' })
  variantId: string;

  @Column({ type: 'uuid' })
  attributeDefinitionId: string;

  @Column({ type: 'uuid', nullable: true })
  valueOptionId?: string | null;

  @Column({ type: 'text', nullable: true })
  valueText?: string | null;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  variant: ProductVariant;

  @ManyToOne(() => AttributeDefinition, { onDelete: 'CASCADE' })
  attributeDefinition: AttributeDefinition;

  @ManyToOne(() => AttributeOption, { onDelete: 'SET NULL', nullable: true })
  valueOption?: AttributeOption | null;
}
