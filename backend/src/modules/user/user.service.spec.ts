import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('creates and finds users', () => {
    service.create({
      name: 'Test',
      email: 'a@test.com',
      passwordHash: 'hash',
      role: 'user',
    });
    expect(service.findAll()).toHaveLength(1);
    expect(service.findByEmail('a@test.com')).toBeDefined();
  });
});
