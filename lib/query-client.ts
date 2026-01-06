/**
 * TanStack Query Client Configuration
 * Centralized setup for React Query with caching and error handling
 * 
 * This is a SINGLETON instance - shared across entire app
 * All React Query hooks use this same client instance
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Global Query Client instance with optimized defaults
 * 
 * Query Options (for useQuery hooks):
 * - staleTime: 5 minutes - Data considered fresh, no refetch needed
 *   - Reduces unnecessary API calls
 *   - Improves performance
 * - gcTime: 10 minutes - How long unused data stays in cache
 *   - Formerly called "cacheTime"
 *   - After this time, unused data is garbage collected
 * - refetchOnWindowFocus: true - Refetch when user returns to tab
 *   - Keeps data fresh when user switches tabs
 * - refetchOnReconnect: true - Refetch when internet reconnects
 *   - Ensures data is current after network issues
 * - retry: 3 - Retry failed requests 3 times
 * - retryDelay: Exponential backoff (1s, 2s, 4s, max 30s)
 *   - Prevents overwhelming server with rapid retries
 * 
 * Mutation Options (for useMutation hooks):
 * - retry: 1 - Retry mutations once (mutations are usually not idempotent)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - unused cache cleared after this
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet reconnects
      retry: 3, // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Exponential backoff: 1s, 2s, 4s, 8s... max 30s
    },
    mutations: {
      retry: 1, // Mutations retry once (they're usually not idempotent)
    },
  },
});
