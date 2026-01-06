"use client";

import React, { useState } from "react";
import { useRequestPasswordReset } from "@/hooks/use-auth";

/**
 * Forgot Password Page - Request password reset email
 * Uses React Query for form submission with toast notifications
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const requestReset = useRequestPasswordReset();
  const sent = requestReset.isSuccess;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestReset.mutate(email);
  };

  return (
    <div className="max-w-md mx-auto mt-36 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
      {sent ? (
        <div className="space-y-4">
          <div className="text-green-600 font-semibold">
            If that email exists, a reset link has been sent.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={requestReset.isPending}
            className="w-full p-2 border disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={requestReset.isPending}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requestReset.isPending ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}
    </div>
  );
}
