import { useQuery } from '@tanstack/react-query';
import { authFetch } from '../lib/auth';
import { User } from '@/types/user';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response: any = await authFetch('/auth/me');
      return response.data as User;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSigners() {
  return useQuery({
    queryKey: ['signers'],
    queryFn: async () => {
      const response: any = await authFetch('/users/signers');
      return response.data as User[];
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}