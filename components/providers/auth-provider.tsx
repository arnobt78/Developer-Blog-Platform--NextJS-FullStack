"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
  session: Session | null;
}

/**
 * AuthProvider - Wraps app with NextAuth SessionProvider
 * Accepts server-side session to prevent hydration mismatch and flickering
 * The session from the server ensures correct UI state on initial render
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={true}
      refetchInterval={0}
    >
      {children}
    </SessionProvider>
  );
}
