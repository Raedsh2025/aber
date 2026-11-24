import axios, { type AxiosError } from 'axios';
import { tokenStorage } from './tokenStorage';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ErrorBody {
  message?: string;
  code?: string;
  details?: unknown;
}

const HTTP_UNAUTHORIZED = 401;
const NO_RESPONSE_STATUS = 0;
const REQUEST_TIMEOUT_MS = 15_000;

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // example: http://localhost:4000/api
  timeout: REQUEST_TIMEOUT_MS,
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One place maps every API failure to an ApiError with an Arabic message.
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorBody>) => {
    const status = error.response?.status ?? NO_RESPONSE_STATUS;
    if (status === HTTP_UNAUTHORIZED) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }
    const message =
      error.response?.data?.message ??
      (status === NO_RESPONSE_STATUS ? 'تعذّر الاتصال بالخادم' : 'حدث خطأ غير متوقع');
    return Promise.reject(
      new ApiError(message, status, error.response?.data?.code, error.response?.data?.details),
    );
  },
);
