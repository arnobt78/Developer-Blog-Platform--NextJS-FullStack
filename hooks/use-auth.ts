/**
 * Custom React Query hooks for authentication
 * Provides caching and state management for user auth
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { User } from "@/types";

interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Check if user is authenticated
 * Reads token from localStorage and validates with server
 *
 * Authentication Flow:
 * 1. Check localStorage for token (client-side check)
 * 2. If token exists, validate with server
 * 3. Server returns user data if token is valid
 *
 * Why validate with server?
 * - Token might be expired
 * - User might be deleted/banned
 * - Token might be invalid/revoked
 *
 * retry: false - Don't retry auth failures (prevents infinite loops)
 */
export function useAuth() {
  return useQuery({
    queryKey: ["auth"], // Single cache key for auth state
    queryFn: async () => {
      // Check for token in localStorage (only available in browser)
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        // No token = not authenticated
        return { valid: false, user: null };
      }
      // Validate token with server
      const response = await fetch("/api/auth/validate", {
        headers: {
          Authorization: `Bearer ${token}`, // Send token in Authorization header
        },
      });
      if (!response.ok) return { valid: false, user: null };
      return response.json() as Promise<{ valid: boolean; user: User | null }>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - auth state doesn't change frequently
    retry: false, // Don't retry auth failures - prevents infinite retry loops
  });
}

/**
 * Get current user profile
 */
export function useUser(userId?: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      // Always use /api/auth/me for current user profile
      // This endpoint returns the full user object
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      return data as User;
    },
    enabled: !!userId || false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Login mutation
 *
 * Login Flow:
 * 1. Send credentials to server
 * 2. Server validates and returns token + user data
 * 3. Store token in localStorage (persists across page refreshes)
 * 4. Invalidate auth query to trigger refetch with new token
 * 5. Redirect to posts page
 *
 * Why localStorage?
 * - Persists across browser sessions
 * - Available on all pages
 * - Simple to implement
 * - Note: Consider httpOnly cookies for better security in production
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Send login credentials to server
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      return response.json(); // Returns { token, user }
    },
    onSuccess: (data) => {
      // Store authentication data in localStorage
      // This persists across page refreshes and browser sessions
      if (typeof window !== "undefined" && data.token) {
        localStorage.setItem("token", data.token);
        if (data.user) {
          // Store user data for quick access (avoid refetch on every page)
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      }
      // Invalidate auth query - this will automatically trigger a refetch
      // No need to call refetchQueries separately (that causes duplicate calls)
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast({
        title: "Success",
        description: "Logged in successfully",
        variant: "success",
      });
      // Redirect to posts page after successful login
      router.push("/posts");
    },
    onError: (error: Error) => {
      // Show error message to user
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Register mutation - supports FormData for avatar upload
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
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // Clear localStorage first (client-side logout)
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      // Note: No server-side logout endpoint needed
      // Token-based auth doesn't require server-side session cleanup
      // Just clearing localStorage and cache is sufficient
      return { success: true };
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all cached data
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast({
        title: "Success",
        description: "Logged out successfully",
        variant: "success",
      });
      router.push("/login");
    },
    onError: (error: Error) => {
      // Still clear cache and redirect even on error
      queryClient.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
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

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update localStorage with new user data (including updated avatar)
      if (typeof window !== "undefined" && data) {
        localStorage.setItem("user", JSON.stringify(data));
      }
      // Invalidate auth query - this will automatically trigger a refetch
      // No need to call refetchQueries separately (that causes duplicate calls)
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
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
