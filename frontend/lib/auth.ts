import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { queryClient } from './queryClient';

const TOKEN_KEY = 'auth_token';
const BASE_URL = 'http://localhost:3003';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400`;
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// create a dedicated axios instance so we can attach interceptors
const authInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
});

// add token automatically to every request
authInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// handle 401 globally
authInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // attempt to refresh the "me" query so subscribers know we've logged out
      try {
        await authInstance.get('/auth/me');
      } catch (_e: unknown) {
        // ignore, we expect this to also 401
      }

      // invalidate and clear cached user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.setQueryData(['user'], undefined);

      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export const baseFetch = async (
  url: string,
  options: AxiosRequestConfig = {}
): Promise<AxiosResponse> => {
  return axios(`${BASE_URL}${url}`, options);
};

export const authFetch = async (
  url: string,
  options: AxiosRequestConfig = {}
): Promise<AxiosResponse> => {
  return authInstance(url, options);
};

// For server-side use (middleware)
export const getTokenFromCookie = (cookies: string): string | null => {
  const cookie = cookies
    .split(';')
    .find((c) => c.trim().startsWith(`${TOKEN_KEY}=`));
  return cookie && cookie.split('=')[1] !== 'undefined' && cookie.split('=')[1] !== 'null'
    ? cookie.split('=')[1]
    : null;
};