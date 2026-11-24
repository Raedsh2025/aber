import type { User } from '@/domain/entities/User';
import type { AuthRepository } from '@/domain/repositories/AuthRepository';
import { http } from '../http/httpClient';

export class ApiAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await http.post<{ data: { token: string; user: User } }>('/auth/login', {
      email,
      password,
    });
    return res.data.data;
  }
}
