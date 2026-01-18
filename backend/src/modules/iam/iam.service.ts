import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class IamService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async ensureRole(name: string) {
    const existing = await this.roleRepository.findOne({ where: { name } });
    if (existing) return existing;
    return this.roleRepository.save(this.roleRepository.create({ name }));
  }

  async ensurePermission(key: string, description?: string) {
    const existing = await this.permissionRepository.findOne({ where: { key } });
    if (existing) return existing;
    return this.permissionRepository.save(
      this.permissionRepository.create({ key, description: description ?? null }),
    );
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    const existing = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });
    if (existing) return existing;
    return this.rolePermissionRepository.save(
      this.rolePermissionRepository.create({ roleId, permissionId }),
    );
  }

  async assignRoleToUser(params: {
    userId: string;
    roleName: string;
    tenantId?: string | null;
    storeId?: string | null;
  }) {
    const role = await this.ensureRole(params.roleName);
    const existing = await this.userRoleRepository.findOne({
      where: {
        userId: params.userId,
        roleId: role.id,
        tenantId: params.tenantId ?? IsNull(),
        storeId: params.storeId ?? IsNull(),
      },
    });

    if (existing) return existing;
    return this.userRoleRepository.save(
      this.userRoleRepository.create({
        userId: params.userId,
        roleId: role.id,
        tenantId: params.tenantId ?? null,
        storeId: params.storeId ?? null,
      }),
    );
  }

  async listUserRoles(userId: string) {
    return this.userRoleRepository.find({
      where: { userId },
      relations: { role: true },
    });
  }
}
