import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ length: 120, unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  roles?: RolePermission[];
}
