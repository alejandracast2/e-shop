import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { IamService } from '../iam/iam.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    }
    return this.stripSensitive(saved);
  }

  async findAll() {
    return this.userRepository.find();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
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

    const saved = await this.userRepository.save(user);
    return this.stripSensitive(saved);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
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
}
