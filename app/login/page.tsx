"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLogin } from "@/hooks/use-auth";

/**
 * Login Page - User authentication
 * Uses React Query for form submission with automatic cache invalidation
 */
export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const login = useLogin();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto m-36">
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
