import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { IamModule } from '../iam/iam.module';
import { Tenant } from '../tenancy/entities/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant]), IamModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
