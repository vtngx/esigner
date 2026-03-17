import { authFetch } from '../lib/auth';
import { ActionLog } from '@/types/logs';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await authFetch('/logs');
      return response.data as ActionLog[];
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
