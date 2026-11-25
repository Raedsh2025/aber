import type { User } from '../entities/User';

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthRepository {
  /** The identifier is an email or a phone number. */
  login(identifier: string, password: string): Promise<{ token: string; user: User }>;
  register(input: RegisterInput): Promise<{ token: string; user: User }>;
}
