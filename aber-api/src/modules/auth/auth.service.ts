import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { AppError } from '../../shared/AppError';
import { normalizePhone } from '../../shared/phone';
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

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthService {
  login(identifier: string, password: string): Promise<LoginResult>;
  register(input: RegisterInput): Promise<LoginResult>;
}

const BCRYPT_COST = 10;

// Same message for unknown identifier, wrong password, ambiguous phone and inactive
// account, so the API does not reveal which accounts exist.
const badCredentials = (): AppError =>
  new AppError(401, 'BAD_CREDENTIALS', 'بيانات الدخول غير صحيحة');

export function createAuthService(repo: AuthRepository, config: AuthServiceConfig): AuthService {
  const issueToken = (row: UserRow): string =>
    jwt.sign(
      { role: row.role, companyId: row.companyId, branchId: row.branchId },
      config.jwtSecret,
      { subject: row.id, expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] },
    );

  const toPublicUser = (row: UserRow): PublicUser => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, isActive, ...user } = row;
    return user;
  };

  return {
    async login(identifier, password) {
      const matches = await repo.findForLogin(identifier, normalizePhone(identifier));
      // More than one match means the phone belongs to several accounts; fail closed.
      const row = matches.length === 1 ? matches[0] : undefined;
      const isValid = row?.isActive && (await bcrypt.compare(password, row.passwordHash));
      if (!row || !isValid) throw badCredentials();
      return { token: issueToken(row), user: toPublicUser(row) };
    },

    async register(input) {
      const phone = normalizePhone(input.phone);
      if (phone === '') throw new AppError(400, 'VALIDATION_ERROR', 'رقم الهاتف غير صالح');
      if (await repo.emailExists(input.email)) {
        throw new AppError(409, 'EMAIL_TAKEN', 'هذا البريد مسجل بالفعل');
      }
      if (await repo.phoneExists(phone)) {
        throw new AppError(409, 'PHONE_TAKEN', 'رقم الهاتف مسجل بالفعل');
      }
      const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
      const row = await repo.createCustomer({
        fullName: input.fullName,
        email: input.email,
        phone,
        passwordHash,
      });
      // A new customer is signed in right away.
      return { token: issueToken(row), user: toPublicUser(row) };
    },
  };
}
