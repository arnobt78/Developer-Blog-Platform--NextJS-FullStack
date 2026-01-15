"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Logout Page - Handle user logout
 * Uses NextAuth signOut for proper session cleanup
 */
export default function Logout() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const performLogout = async () => {
      // Show friendly goodbye toast first
      toast({
        title: "See you soon 👋",
        description: "Thanks for visiting! We'll be here whenever you're ready to come back.",
        variant: "success",
      });
      
      // Immediately redirect to login page to prevent UI flash
      // This happens synchronously, preventing any re-render with cleared session
      router.push("/login");
      
      // Sign out in the background (clears session and cookies)
      // This happens after redirect, so no flash is visible
      await signOut({ redirect: false });
      
      // Clear all React Query cache
      queryClient.clear();
      
      // Refresh to update SSR session state
      router.refresh();
    };

    performLogout();
  }, [toast, router, queryClient]);

  return null;
}
