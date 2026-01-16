import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Entity('colors')
export class Color {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  hex?: string | null;

  @OneToMany(() => ProductVariant, (variant) => variant.color)
  variants?: ProductVariant[];
}
