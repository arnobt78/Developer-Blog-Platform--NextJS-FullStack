/**
 * Custom React Query hooks for authentication with NextAuth v5
 * Provides caching and state management for user auth
 */

"use client";

import { useSession, signOut } from "next-auth/react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { User } from "@/types";

/**
 * Check if user is authenticated using NextAuth session
 * This replaces the old localStorage token approach
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    data: {
      valid: status === "authenticated",
      user: session?.user || null,
    },
    isLoading: status === "loading",
  };
}

/**
 * Get current user profile
 */
export function useUser(userId?: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      // NextAuth cookies are sent automatically
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      return data as User;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Register new user
 * Note: Login is handled by NextAuth signIn() in the login page
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast({
        title: "Success",
        description: "Account created successfully",
        variant: "success",
      });
      router.push("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Logout mutation using NextAuth signOut
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // Use NextAuth signOut - clears session automatically
      await signOut({ redirect: false });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all cached data
      toast({
        title: "Success",
        description: "Logged out successfully",
        variant: "success",
      });
      router.push("/login");
    },
    onError: (error: Error) => {
      queryClient.clear();
      router.push("/login");
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Failed to update profile"
        );
      }
      return response.json();
    },
    onSuccess: async (_data, _variables) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      // Show success toast
      toast({
        title: "Profile Updated!",
        description: "Your profile was updated successfully.",
        variant: "success",
      });
      // Soft SSR refresh to update UI everywhere
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Request password reset
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send reset email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset email sent",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Reset password with token and email
 */
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      token,
      password,
    }: {
      email: string;
      token: string;
      password: string;
    }) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          resetToken: token,
          newPassword: password,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || error.message || "Failed to reset password"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully",
        variant: "success",
      });
      setTimeout(() => router.push("/login"), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
