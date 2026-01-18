import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Role } from './role.entity';
import { User } from '../../user/entities/user.entity';

@Entity('user_roles')
export class UserRole extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  storeId?: string | null;

  @Column({ type: 'uuid' })
  roleId: string;

  @ManyToOne(() => User, (user) => user.roles, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  role: Role;
}
