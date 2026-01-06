/**
 * Report Post Hook
 * Handles post reporting with React Query and toast notifications
 */

"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Hook for reporting posts
 * Manages report state and API calls
 */
export function useReportPost() {
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const reportPost = async (postId: string, reason?: string) => {
    setIsReporting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to report post");
      }
      setReportReason(reason || "");
      toast({
        title: "Success",
        description: "Post reported! Thank you for your feedback.",
        variant: "success",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to report post.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsReporting(false);
    }
  };

  return {
    reportPost,
    isReporting,
    reportReason,
  };
}

