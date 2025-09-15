import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

jest.mock('@nestjs/passport', () => ({ AuthGuard: () => class {} }), { virtual: true });

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('returns current user', () => {
    const user = service.create({
      name: 'Test',
      email: 'a@test.com',
      passwordHash: 'hash',
      role: 'user',
    });
    expect(controller.getMe({ user } as any)).toEqual(user);
  });

  it('returns all users for admin', () => {
    service.create({ name: 'Test', email: 'a@test.com', passwordHash: 'hash', role: 'user' });
    const users = controller.findAll();
    expect(users).toHaveLength(1);
  });
});
