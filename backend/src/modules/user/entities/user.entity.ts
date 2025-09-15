export type UserRole = 'user' | 'admin';

export class User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

