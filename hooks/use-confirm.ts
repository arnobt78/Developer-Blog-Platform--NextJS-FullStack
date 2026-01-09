/**
 * Confirmation Dialog Hook
 * Provides reusable confirmation dialog using state and callbacks
 */

"use client";

import { useState, useCallback } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Hook for confirmation dialogs
 * Returns a function to trigger confirmation
 */
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (options) {
      options.onConfirm();
      setIsOpen(false);
      setOptions(null);
    }
  }, [options]);

  const handleCancel = useCallback(() => {
    if (options) {
      options.onCancel?.();
      setIsOpen(false);
      setOptions(null);
    }
  }, [options]);

  return {
    confirm,
    isOpen,
    message: options?.message || "",
    title: options?.title || "Confirm",
    confirmText: options?.confirmText || "Confirm",
    cancelText: options?.cancelText || "Cancel",
    handleConfirm,
    handleCancel,
  };
}

/**
 * Simple confirmation hook - deprecated
 * Use ConfirmDialog component instead for better UX
 * @deprecated Use ConfirmDialog component directly
 */
export function useSimpleConfirm() {
  // This hook is kept for backward compatibility but should not be used
  // Use ConfirmDialog component instead
  return useCallback((message: string, onConfirm: () => void) => {
    // Fallback to window.confirm only if absolutely necessary
    // Prefer using ConfirmDialog component for better UX
    if (typeof window !== "undefined" && window.confirm(message)) {
      onConfirm();
    }
  }, []);
}
