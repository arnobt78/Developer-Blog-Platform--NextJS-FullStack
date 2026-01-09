"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

/**
 * Logout Page - Handle user logout
 * Uses NextAuth signOut for proper session cleanup
 */
export default function Logout() {
  useEffect(() => {
    signOut({ redirect: true, callbackUrl: "/login" });
  }, []);

  return null;
}
