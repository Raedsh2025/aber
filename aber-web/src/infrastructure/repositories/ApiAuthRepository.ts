import type { User } from '@/domain/entities/User';
import type { AuthRepository, RegisterInput } from '@/domain/repositories/AuthRepository';
import { http } from '../http/httpClient';

export class ApiAuthRepository implements AuthRepository {
  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const res = await http.post<{ data: { token: string; user: User } }>('/auth/login', {
      identifier,
      password,
    });
    return res.data.data;
  }

  async register(input: RegisterInput): Promise<{ token: string; user: User }> {
    const res = await http.post<{ data: { token: string; user: User } }>('/auth/register', input);
    return res.data.data;
  }
}
