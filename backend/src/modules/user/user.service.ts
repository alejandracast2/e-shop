import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private users: User[] = [];
  private id = 1;

  create(createUserDto: CreateUserDto): User {
    const user: User = { id: this.id++, ...createUserDto };
    this.users.push(user);
    return user;
  }

  findAll(): User[] {
    return this.users;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  // Stub methods for completeness
  update(id: number, updateUserDto: UpdateUserDto) {
    const user = this.findById(id);
    if (!user) return undefined;
    Object.assign(user, updateUserDto);
    return user;
  }

  remove(id: number) {
    this.users = this.users.filter((u) => u.id !== id);
  }
}
