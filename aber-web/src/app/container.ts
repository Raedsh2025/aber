import { ApiAuthRepository } from '@/infrastructure/repositories/ApiAuthRepository';

// The only place that knows the real implementations. Tests replace it with fakes.
export const authRepository = new ApiAuthRepository();
