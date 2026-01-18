import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../modules/user/user.service';
import { IamService } from '../modules/iam/iam.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly iamService: IamService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user || !user.isActive) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userService.updateLastLogin(user.id);
    const assignments = await this.iamService.listUserRoles(user.id);
    const roles = assignments.map((assignment) => ({
      role: assignment.role.name,
      tenantId: assignment.tenantId ?? undefined,
      storeId: assignment.storeId ?? undefined,
    }));

    const payload = { sub: user.id, email: user.email, roles };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: { ...user, roles },
    };
  }
}
