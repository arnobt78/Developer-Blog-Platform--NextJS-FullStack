/**
 * Custom React Query hooks for notifications
 * Provides caching and real-time notification management
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { Notification } from "@/types";
import { useSession } from "next-auth/react";

/**
 * Fetch all notifications for current user
 * Requires authentication - NextAuth cookies are sent automatically
 */
export function useNotifications() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return useQuery<Notification[], Error>({
    queryKey: ["notifications"],
    queryFn: async () => {
      // NextAuth cookies are sent automatically
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json() as Promise<Notification[]>;
    },
    enabled: isAuthenticated, // Only fetch when user is authenticated
    staleTime: 2 * 60 * 1000, // 2 minutes - increased to reduce unnecessary refetches
    refetchInterval: isAuthenticated ? 2 * 60 * 1000 : false, // Refetch every 2 minutes when authenticated
    refetchOnMount: true, // Refetch on mount if data is stale (respects staleTime, React Query deduplicates simultaneous calls)
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce API calls
  });
}

/**
 * Get unread notification count
 */
export function useUnreadCount() {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter((n: Notification) => !n.isRead).length || 0;
}

/**
 * Mark notification as read
 * Requires authentication - NextAuth cookies are sent automatically
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      // NextAuth cookies are sent automatically
      const response = await fetch(
        `/api/notifications/${notificationId}/mark-read`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to mark notification as read");
      return response.json();
    },
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>([
        "notifications",
      ]);

      // Optimistically update
      if (previousNotifications) {
        const updatedNotifications = previousNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        );
        queryClient.setQueryData(["notifications"], updatedNotifications);
      }

      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // Rollback to previous state
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications"],
          context.previousNotifications
        );
      }
      toast({
        title: "Error",
        description: err.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Refetch notifications to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Mark all notifications as read
 * Requires authentication - NextAuth cookies are sent automatically
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // NextAuth cookies are sent automatically
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to mark all as read");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      // Only show toast if notifications were actually marked as read
      if (data.count > 0) {
        toast({
          title: "Success",
          description: "All notifications marked as read",
          variant: "success",
        });
      }
      // If count is 0, no toast is shown (no unread notifications to mark)
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete a notification
 * Requires authentication - NextAuth cookies are sent automatically
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      // NextAuth cookies are sent automatically
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete notification");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Success",
        description: "Notification deleted",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Clear all notifications
 * Requires authentication - NextAuth cookies are sent automatically
 */
export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // NextAuth cookies are sent automatically
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to clear notifications");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Success",
        description: "All notifications cleared",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
