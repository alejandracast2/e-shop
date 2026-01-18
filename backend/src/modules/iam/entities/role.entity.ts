import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ length: 64, unique: true })
  name: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  permissions?: RolePermission[];
}
