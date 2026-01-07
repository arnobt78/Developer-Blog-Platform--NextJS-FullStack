"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLogin } from "@/hooks/use-auth";
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
  const login = useLogin();

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
   * Prevents default form behavior and triggers React Query mutation
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(form);
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
        disabled={login.isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {login.isPending ? "Logging in..." : "Login"}
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
