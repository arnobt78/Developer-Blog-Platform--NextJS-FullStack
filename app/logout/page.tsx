"use client";

import { useEffect } from "react";
import { useLogout } from "@/hooks/use-auth";

/**
 * Logout Page - Handle user logout
 * Uses React Query mutation for logout with cache clearing
 */
export default function Logout() {
  const logout = useLogout();

  useEffect(() => {
    logout.mutate();
  }, [logout]);

  return null;
}
