import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { AppError } from '../../shared/AppError';
import type { AuthRepository, UserRow } from './auth.repository';

export interface AuthServiceConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
}

export type PublicUser = Omit<UserRow, 'passwordHash' | 'isActive'>;

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export interface AuthService {
  login(email: string, password: string): Promise<LoginResult>;
}

// Same message for unknown email, wrong password and inactive account, so the API
// does not reveal which accounts exist.
const badCredentials = (): AppError =>
  new AppError(401, 'BAD_CREDENTIALS', 'البريد أو كلمة المرور غير صحيحة');

export function createAuthService(repo: AuthRepository, config: AuthServiceConfig): AuthService {
  return {
    async login(email, password) {
      const row = await repo.findByEmail(email);
      const isValid = row?.isActive && (await bcrypt.compare(password, row.passwordHash));
      if (!row || !isValid) throw badCredentials();

      const token = jwt.sign(
        { role: row.role, companyId: row.companyId, branchId: row.branchId },
        config.jwtSecret,
        { subject: row.id, expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] },
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, isActive, ...user } = row;
      return { token, user };
    },
  };
}
