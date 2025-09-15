import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

jest.mock(
  'bcrypt',
  () => ({ hash: jest.fn(), compare: jest.fn() }),
  { virtual: true },
);

jest.mock(
  '@nestjs/jwt',
  () => {
    class JwtService {
      signAsync = jest.fn().mockResolvedValue('token');
    }
    return { JwtService };
  },
  { virtual: true },
);

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UserService, JwtService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('register hashes password', async () => {
    await service.register({ name: 'Test', email: 'a@test.com', password: 'pass' });
    expect(bcrypt.hash).toHaveBeenCalled();
    expect(userService.findAll()).toHaveLength(1);
  });

  it('login returns token', async () => {
    await service.register({ name: 'Test', email: 'a@test.com', password: 'pass' });
    const res = await service.login({ email: 'a@test.com', password: 'pass' });
    expect(res.access_token).toBeDefined();
  });
});
