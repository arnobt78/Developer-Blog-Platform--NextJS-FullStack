/**
 * Input Dialog Component - Reusable input dialog for prompts
 * Replaces window.prompt with ShadCN Dialog
 * 
 * Why replace window.prompt?
 * - window.prompt is blocking (freezes UI)
 * - Not customizable or styled
 * - Poor mobile experience
 * - Can't show rich content
 * 
 * Usage:
 * const [showDialog, setShowDialog] = useState(false);
 * <InputDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   title="Report Post"
 *   description="Why are you reporting?"
 *   onConfirm={(reason) => reportPost(reason)}
 *   type="textarea"
 * />
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InputDialogProps {
  open: boolean; // Control dialog visibility
  onOpenChange: (open: boolean) => void; // Callback when dialog state changes
  title?: string; // Dialog title
  description?: string; // Optional description text
  placeholder?: string; // Input placeholder text
  defaultValue?: string; // Initial input value
  confirmText?: string; // Confirm button text
  cancelText?: string; // Cancel button text
  onConfirm: (value: string) => void; // Called with input value when confirmed
  onCancel?: () => void; // Optional: Called when cancelled
  type?: "text" | "textarea"; // Input type (single line or multi-line)
}

/**
 * Reusable input dialog component
 * Provides consistent UI for text input prompts
 * 
 * Features:
 * - Single-line or multi-line input
 * - Keyboard shortcuts (Enter to confirm, ESC to cancel)
 * - Auto-focus on input
 * - Resets value when dialog opens
 */
export function InputDialog({
  open,
  onOpenChange,
  title = "Enter Value",
  description,
  placeholder = "Enter value...",
  defaultValue = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "text",
}: InputDialogProps) {
  // Local state for input value
  const [value, setValue] = useState(defaultValue);

  /**
   * Reset value when dialog opens/closes
   * 
   * This ensures:
   * - Fresh input each time dialog opens
   * - Value matches defaultValue prop
   * - No stale data from previous uses
   */
  useEffect(() => {
    if (open) {
      setValue(defaultValue); // Reset to default when opening
    }
  }, [open, defaultValue]);

  const handleConfirm = () => {
    onConfirm(value);
    onOpenChange(false);
    setValue("");
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">
          {type === "textarea" ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                }
              }}
            />
          )}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

