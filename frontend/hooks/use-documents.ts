import { authFetch } from '../lib/auth';
import { Document, VerifyDocument } from '@/types/document';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    placeholderData: [],
    queryFn: async () => {
      const response: any = await authFetch('/documents');
      return response.data as Document[];
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const res = await authFetch("/documents/upload", {
        method: "POST",
        data: formData,
      })
      return res.data as Document
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["documents", "summary"]
      })
    }
  })
}

export const useUpdateSigners = () => {
  return useMutation({
    mutationFn: async (data: { documentId: string; signers: string[] }) => {
      const res = await authFetch(`/documents/${data.documentId}/signers`, {
        method: 'POST',
        data: { signerUsernames: data.signers },
      });
      return res.data;
    },
  })
}

export const useSignDoc = () => {
  return useMutation({
    mutationFn: async (data: { documentId: string; signature: string }) => {
      const res = await authFetch(`/documents/${data.documentId}/sign`, {
        method: 'POST',
        data: { signature: data.signature },
      });
      return res.data;
    },
  })
}

export const useAnchorDoc = () => {
  return useMutation({
    mutationFn: async (data: { documentId: string }) => {
      const res = await authFetch(`/documents/${data.documentId}/anchor`, {
        method: 'POST',
      });
      return res.data;
    },
  })
}

export const useVerifyDoc = () => {
  return useMutation({
    mutationFn: async (data: { documentId: string }) => {
      const res = await authFetch(`/documents/${data.documentId}/verify`);
      return res.data as VerifyDocument;
    },
  })
}

export const useDeleteDoc = () => {
  return useMutation({
    mutationFn: async (data: { documentId: string }) => {
      const res = await authFetch(`/documents/${data.documentId}`, { method: 'DELETE' });
      return res.data;
    },
  })
}

export const useExportDoc = () => {
  return useMutation({
    mutationFn: async (data: { documentId: string }) => {
      const res = await authFetch(
        `/pdf-export/${data.documentId}/export`,
        { responseType: "blob" },
      );
      return res.data;
    },
  })
}
