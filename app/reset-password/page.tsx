"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useResetPassword } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reset Password Form Component
 * Uses React Query for password reset with validation
 */
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const resetPassword = useResetPassword();

  // Debug: Log URL parameters
  useEffect(() => {
    console.log("[ResetPassword] URL params - email:", email, "token:", token ? `${token.substring(0, 10)}...` : "missing");
  }, [email, token]);

  useEffect(() => {
    if (!email || !token) {
      setLocalError("Invalid or missing reset token. Please check the email link and ensure both email and token parameters are present.");
    } else {
      setLocalError(""); // Clear error if both are present
    }
  }, [email, token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (!email || !token) {
      setLocalError("Invalid or missing reset token.");
      return;
    }
    resetPassword.mutate({ email, token, password: newPassword });
  };

  if (resetPassword.isSuccess) {
    return (
      <div className="max-w-md mx-auto mt-36 p-6 bg-white rounded shadow text-green-600 font-semibold">
        Password has been reset! Redirecting to login...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-36 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          required
          className="w-full p-2 border"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          className="w-full p-2 border"
        />
        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetPassword.isPending ? "Resetting..." : "Reset Password"}
        </button>
        {(localError || resetPassword.error) && (
          <div className="text-red-600">
            {localError ||
              (resetPassword.error instanceof Error
                ? resetPassword.error.message
                : "Failed to reset password.")}
          </div>
        )}
      </form>
    </div>
  );
}

/**
 * Reset Password Page - Reset password with token
 * Uses Suspense for search params with skeleton loading
 */
export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto mt-36 p-6 bg-white rounded shadow space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
