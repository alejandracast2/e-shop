import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { IamService } from '../iam/iam.service';
import { Tenant } from '../tenancy/entities/tenant.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly iamService: IamService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      phone: createUserDto.phone ?? null,
      passwordHash,
      isActive: createUserDto.isActive ?? true,
    });

    const saved = await this.userRepository.save(user);
    if (createUserDto.roleName) {
      await this.iamService.assignRoleToUser({
        userId: saved.id,
        roleName: createUserDto.roleName,
        tenantId: createUserDto.tenantId ?? null,
        storeId: createUserDto.storeId ?? null,
      });
      await this.assignTenantOwnership(saved.id, createUserDto);
    }

    const createdUser = await this.findUserEntity(saved.id, true);
    return this.toResponse(createdUser);
  }

  async findAll() {
    const users = await this.userRepository.find({
      relations: { roles: { role: true } },
    });

    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: string) {
    const user = await this.findUserEntity(id, true);
    return this.toResponse(user);
  }

  async findByEmailWithPassword(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'phone', 'passwordHash', 'isActive'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    user.name = updateUserDto.name ?? user.name;
    user.email = updateUserDto.email ?? user.email;
    user.phone = updateUserDto.phone ?? user.phone;
    user.isActive = updateUserDto.isActive ?? user.isActive;

    await this.userRepository.save(user);

    const updatedUser = await this.findUserEntity(id, true);
    return this.toResponse(updatedUser);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByGoogleSubject(googleSubject: string) {
    return this.userRepository.findOne({ where: { googleSubject } });
  }

  async findUserById(id: string) {
    return this.findOneEntity(id);
  }

  async createCustomerUser(params: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    googleSubject?: string;
  }) {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = this.userRepository.create({
      name: params.name,
      email: params.email,
      phone: params.phone ?? null,
      passwordHash: await bcrypt.hash(params.password, 10),
      googleSubject: params.googleSubject ?? null,
      isActive: true,
    });
    return this.userRepository.save(user);
  }

  async linkGoogleSubject(userId: string, googleSubject: string) {
    const existing = await this.findByGoogleSubject(googleSubject);
    if (existing && existing.id !== userId) {
      throw new ConflictException('Google account already linked to another user');
    }

    await this.userRepository.update(userId, { googleSubject });
    return this.findOneEntity(userId);
  }

  async updateCustomerPassword(userId: string, password: string) {
    const user = await this.findOneEntity(userId, true);
    user.passwordHash = await bcrypt.hash(password, 10);
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findUserEntity(id);
    await this.userRepository.remove(user);
    return { deleted: true };
  }

  async updateLastLogin(id: string) {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  private stripSensitive(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private async assignTenantOwnership(userId: string, createUserDto: CreateUserDto) {
    if (createUserDto.roleName !== 'tenant_owner' || !createUserDto.tenantId) {
      return;
    }

    const tenant = await this.tenantRepository.findOne({
      where: { id: createUserDto.tenantId },
    });
    if (!tenant || tenant.ownerUserId) {
      return;
    }

    tenant.ownerUserId = userId;
    await this.tenantRepository.save(tenant);
  }

  private async findUserEntity(id: string, withRoles = false) {
    const user = await this.userRepository.findOne({
      where: { id },
      ...(withRoles ? { relations: { roles: { role: true } } } : {}),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async findOneEntity(id: string, withPassword = false) {
    const user = await this.userRepository.findOne({
      where: { id },
      ...(withPassword ? { select: ['id', 'name', 'email', 'phone', 'googleSubject', 'passwordHash', 'isActive', 'lastLoginAt'] } : {}),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private toResponse(user: User) {
    const safeUser = this.stripSensitive(user);

    return {
      ...safeUser,
      roles:
        user.roles?.map((assignment) => ({
          id: assignment.id,
          roleId: assignment.roleId,
          role: assignment.role?.name,
          tenantId: assignment.tenantId ?? undefined,
          storeId: assignment.storeId ?? undefined,
        })) ?? [],
    };
  }
}
