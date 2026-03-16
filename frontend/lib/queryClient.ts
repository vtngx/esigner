import { QueryClient } from '@tanstack/react-query';

// Single global query client that can be imported from anywhere in the
// front‑end codebase.  We want a single instance so that our interceptors
// can invalidate queries when necessary.
export const queryClient = new QueryClient();
