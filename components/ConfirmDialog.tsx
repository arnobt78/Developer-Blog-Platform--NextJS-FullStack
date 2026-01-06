/**
 * Confirm Dialog Component - Reusable confirmation dialog
 * Replaces window.confirm with ShadCN AlertDialog
 * 
 * Why replace window.confirm?
 * - Better UX: Customizable, accessible, styled
 * - Consistent with app design
 * - Can be themed and animated
 * - Better mobile support
 * - Can show rich content (not just text)
 * 
 * Usage:
 * const [showConfirm, setShowConfirm] = useState(false);
 * <ConfirmDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Delete Post"
 *   description="Are you sure?"
 *   onConfirm={() => deletePost()}
 *   variant="destructive"
 * />
 */

"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean; // Control dialog visibility
  onOpenChange: (open: boolean) => void; // Callback when dialog state changes
  title?: string; // Dialog title (default: "Confirm Action")
  description: string; // Required: Description text
  confirmText?: string; // Confirm button text (default: "Confirm")
  cancelText?: string; // Cancel button text (default: "Cancel")
  onConfirm: () => void; // Called when user confirms
  onCancel?: () => void; // Optional: Called when user cancels
  variant?: "default" | "destructive"; // Button style (destructive = red for dangerous actions)
}

/**
 * Reusable confirmation dialog component
 * Provides consistent UI for confirmation actions
 * 
 * Features:
 * - Accessible (keyboard navigation, screen reader support)
 * - Animated (smooth open/close)
 * - Themed (matches app design)
 * - Variants (default or destructive for dangerous actions)
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Confirm Action",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  /**
   * Handle confirm button click
   * 
   * Flow:
   * 1. Execute onConfirm callback (e.g., delete post)
   * 2. Close dialog
   */
  const handleConfirm = () => {
    onConfirm(); // Execute the action
    onOpenChange(false); // Close dialog
  };

  /**
   * Handle cancel button click or ESC key
   * 
   * Flow:
   * 1. Execute optional onCancel callback
   * 2. Close dialog
   */
  const handleCancel = () => {
    onCancel?.(); // Optional callback (e.g., cleanup)
    onOpenChange(false); // Close dialog
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              variant === "destructive"
                ? "bg-error text-white hover:bg-error/90 focus:ring-error"
                : ""
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

