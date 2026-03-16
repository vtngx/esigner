import { useQuery } from '@tanstack/react-query';
import { authFetch } from '../lib/auth';
import { DocumentSummary } from '@/types/document';

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    placeholderData: {
      owned: 0,
      assigned: 0,
      signed: 0,
    },
    queryFn: async () => {
      const response: any = await authFetch('/documents/dashboard');
      return response.data as DocumentSummary;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
