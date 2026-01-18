import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { IamService } from './iam.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRole])],
  providers: [IamService],
  exports: [IamService, TypeOrmModule],
})
export class IamModule {}
