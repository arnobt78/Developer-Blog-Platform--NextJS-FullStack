/**
 * useToast Hook - Sonner Toast Wrapper
 * Provides toast notification functionality with auto-dismiss and close button
 */

"use client";

import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?:
    | "default"
    | "success"
    | "destructive"
    | "error"
    | "warning"
    | "info";
  duration?: number;
};

/**
 * Toast function that can be imported directly in hooks
 * Accepts title/description/variant pattern for backwards compatibility
 */
export const toast = ({
  title,
  description,
  variant = "default",
  duration = 5000,
}: ToastOptions) => {
  const message = title || description || "";
  const desc = title && description ? description : undefined;

  switch (variant) {
    case "success":
      sonnerToast.success(message, {
        description: desc,
        duration,
      });
      break;
    case "destructive":
    case "error":
      sonnerToast.error(message, {
        description: desc,
        duration,
      });
      break;
    case "warning":
      sonnerToast.warning(message, {
        description: desc,
        duration,
      });
      break;
    case "info":
      sonnerToast.info(message, {
        description: desc,
        duration,
      });
      break;
    default:
      sonnerToast(message, {
        description: desc,
        duration,
      });
  }
};

/**
 * useToast hook for components
 * Returns toast function wrapped in an object
 */
export function useToast() {
  return { toast };
}
