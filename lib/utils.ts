/**
 * Utility functions for the application
 * Provides common helpers for class names, formatting, etc.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with proper precedence
 * 
 * Why this function?
 * - Tailwind classes can conflict (e.g., "p-4" and "p-2")
 * - twMerge resolves conflicts by keeping the last class
 * - clsx handles conditional classes and arrays
 * 
 * Example:
 * cn("p-4", "p-2") => "p-2" (p-2 wins)
 * cn("text-red", condition && "text-blue") => "text-red text-blue" or "text-red"
 * 
 * @param inputs - Class values to merge (strings, objects, arrays, conditionals)
 * @returns Merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  // clsx: Combines class names (handles conditionals, arrays, objects)
  // twMerge: Resolves Tailwind class conflicts (keeps last one)
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a readable string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Truncates text to a specified length
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text with ellipsis
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}
