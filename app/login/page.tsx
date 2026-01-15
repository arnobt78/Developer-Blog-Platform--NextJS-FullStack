"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Test account credentials for development/testing
 * Maps role values to email and password credentials
 *
 * Available test accounts:
 * - Test User: test@user.com / 12345678
 * - Test Admin: test@admin.com / 12345678
 */
const testAccounts = {
  "test-user": {
    email: "test@user.com",
    password: "12345678",
    label: "Test User",
  },
  "test-admin": {
    email: "test@admin.com",
    password: "12345678",
    label: "Test Admin",
  },
} as const;

/**
 * Login Page - User authentication
 * Uses React Query for form submission with automatic cache invalidation
 * Includes dropdown for quick test account selection (development/testing)
 */
export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Handle input field changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Handle test account role selection
   * Auto-fills email and password fields with test credentials
   * Supports "clear" option to reset selection and form fields
   */
  const handleRoleSelect = (value: string) => {
    if (value === "clear") {
      // Reset to initial state
      setSelectedRole("");
      setForm({ email: "", password: "" });
    } else {
      // Auto-fill with test account credentials
      setSelectedRole(value);
      const account = testAccounts[value as keyof typeof testAccounts];
      if (account) {
        setForm({
          email: account.email,
          password: account.password,
        });
      }
    }
  };

  /**
   * Handle form submission
   * Uses NextAuth signIn with credentials provider
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result?.ok) {
        // Fetch user data to get name for personalized welcome message
        try {
          const userResponse = await fetch("/api/auth/me", {
            credentials: "include",
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const userName = userData?.name || "there";
            toast({
              title: `Hi, ${userName} 👋`,
              description: "Welcome! Enjoy blogging and sharing your thoughts with the community.",
              variant: "success",
            });
          } else {
            // Fallback if user data fetch fails
            toast({
              title: "Hi there 👋",
              description: "Welcome! Enjoy blogging and sharing your thoughts with the community.",
              variant: "success",
            });
          }
        } catch {
          // Fallback if user data fetch fails
          toast({
            title: "Hi there 👋",
            description: "Welcome! Enjoy blogging and sharing your thoughts with the community.",
            variant: "success",
          });
        }
        
        // Invalidate notifications query to trigger fresh fetch after login
        // This ensures notifications appear immediately in navbar badge
        // Note: useAuth hook also invalidates, but React Query deduplicates simultaneous invalidations
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        
        router.push("/posts");
        router.refresh();
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto m-36">
      {/* Test Credentials Dropdown - Development/Testing Only */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Quick Test Login
        </label>
        <Select
          key={`select-${selectedRole || "empty"}`}
          value={selectedRole || undefined}
          onValueChange={handleRoleSelect}
        >
          <SelectTrigger className="w-full border-gray-300 bg-white">
            <SelectValue placeholder="Select Role Based Test Account" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200">
            {selectedRole && (
              <SelectItem
                value="clear"
                className="text-gray-400 hover:text-gray-600 italic"
              >
                Clear Selection
              </SelectItem>
            )}
            <SelectItem
              value="test-user"
              className="cursor-pointer hover:bg-gray-100"
            >
              {testAccounts["test-user"].label}
            </SelectItem>
            <SelectItem
              value="test-admin"
              className="cursor-pointer hover:bg-gray-100"
            >
              {testAccounts["test-admin"].label}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        className="w-full p-2 border"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
        className="w-full p-2 border"
      />
      <div className="flex justify-end mb-2">
        <Link
          href="/forgot-password"
          prefetch={false}
          className="text-blue-600 hover:underline text-sm"
        >
          Forgot Password?
        </Link>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
      <div className="mt-4 text-center">
        <span>Don't have an account? </span>
        <Link href="/register" className="text-blue-600 underline">
          Register here
        </Link>
      </div>
    </form>
  );
}
