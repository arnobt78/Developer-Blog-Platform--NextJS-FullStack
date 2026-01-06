/**
 * Query Provider - TanStack React Query Wrapper
 * Provides caching and state management for async data
 */

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app with React Query functionality
 * Enables caching, background refetching, and optimistic updates
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
