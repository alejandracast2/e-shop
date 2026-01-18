import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission extends BaseEntity {
  @Column({ type: 'uuid' })
  roleId: string;

  @Column({ type: 'uuid' })
  permissionId: string;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.roles, {
    onDelete: 'CASCADE',
  })
  permission: Permission;
}
