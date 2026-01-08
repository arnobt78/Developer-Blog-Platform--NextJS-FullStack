/**
 * Custom React Query hooks for comments
 * Provides caching, optimistic updates, and automatic refetching
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { Comment } from "@/types";

/**
 * Fetch comments for a specific post
 * Includes Authorization header to get user-specific liked/helpful status
 */
export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      // Get token from localStorage for authentication
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/comments/post/${postId}`, {
        headers,
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json() as Promise<Comment[]>;
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create a new comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      postId: string;
      content: string;
      parentId?: string;
      imageUrl?: string;
      fileId?: string;
    }) => {
      // Get token from localStorage for authentication
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Create FormData for file upload support
      const formData = new FormData();
      formData.append("content", data.content);
      if (data.parentId) formData.append("parentId", data.parentId);
      if (data.imageUrl) formData.append("imageUrl", data.imageUrl);
      if (data.fileId) formData.append("fileId", data.fileId);

      const response = await fetch(`/api/comments/post/${data.postId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || error.message || "Failed to create comment"
        );
      }
      return response.json();
    },
    onSettled: (data, error, variables) => {
      // Update cache immediately with new comment if successful
      if (data) {
        const comments = queryClient.getQueryData<Comment[]>([
          "comments",
          variables.postId,
        ]);
        if (comments) {
          queryClient.setQueryData<Comment[]>(
            ["comments", variables.postId],
            [...comments, data]
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      // Cache already updated in onSettled, now invalidate for background refetch
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
        refetchType: "none",
      });
      // Background refetch (non-blocking)
      queryClient.refetchQueries({ queryKey: ["comments", variables.postId] });
      queryClient.refetchQueries({ queryKey: ["post", variables.postId] });
      toast({
        title: "Success",
        description: "Comment posted successfully",
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
 * Update an existing comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      postId: _postId,
    }: {
      id: string;
      content: string;
      postId: string;
    }) => {
      // Get token from localStorage for authentication
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Failed to update comment"
        );
      }
      return response.json();
    },
    onSettled: (data, error, variables) => {
      // Update cache immediately with updated comment if successful
      if (data) {
        const comments = queryClient.getQueryData<Comment[]>([
          "comments",
          variables.postId,
        ]);
        if (comments) {
          queryClient.setQueryData<Comment[]>(
            ["comments", variables.postId],
            comments.map((comment) =>
              comment.id === variables.id ? data : comment
            )
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      // Cache already updated in onSettled, now invalidate for background refetch
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
        refetchType: "none",
      });
      // Background refetch (non-blocking)
      queryClient.refetchQueries({ queryKey: ["comments", variables.postId] });
      toast({
        title: "Success",
        description: "Comment updated successfully",
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
 * Delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      postId: _postId,
    }: {
      id: string;
      postId: string;
    }) => {
      // Get token from localStorage for authentication
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Failed to delete comment"
        );
      }
      // Return success for 204 No Content response (no body to parse)
      return { success: true };
    },
    onMutate: async ({ id, postId }) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });

      // Snapshot previous value for rollback
      const previousComments = queryClient.getQueryData<Comment[]>([
        "comments",
        postId,
      ]);

      // Optimistically remove comment from cache
      if (previousComments) {
        queryClient.setQueryData<Comment[]>(
          ["comments", postId],
          previousComments.filter((comment) => comment.id !== id)
        );
      }

      return { previousComments };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", variables.postId],
          context.previousComments
        );
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // Cache already updated optimistically in onMutate
      // Now invalidate for background refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
        refetchType: "none",
      });
      // Background refetch (non-blocking)
      queryClient.refetchQueries({ queryKey: ["comments", variables.postId] });
      queryClient.refetchQueries({ queryKey: ["post", variables.postId] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
        variant: "success",
      });
    },
  });
}

/**
 * Like/unlike a comment with optimistic update
 * Instantly toggles liked state and updates count in UI
 * Uses server response data to prevent flicker and ensure accuracy
 */
export function useLikeComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      postId: _postId,
    }: {
      commentId: string;
      postId: string;
    }) => {
      // Get token from localStorage for authentication
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to like comment");
      return response.json();
    },
    onMutate: async ({ commentId, postId }) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });

      // Snapshot previous value for rollback on error
      const previousComments = queryClient.getQueryData<Comment[]>([
        "comments",
        postId,
      ]);

      // Optimistically update - toggle liked state and adjust count
      if (previousComments) {
        queryClient.setQueryData<Comment[]>(
          ["comments", postId],
          (old) =>
            old?.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    likeCount: comment.liked
                      ? Math.max(0, comment.likeCount - 1)
                      : comment.likeCount + 1,
                    liked: !comment.liked,
                  }
                : comment
            ) || []
        );
      }

      return { previousComments };
    },
    onSuccess: (data, variables) => {
      // Update cache with authoritative server response
      // This prevents flicker by not triggering a refetch
      const { liked, likeCount } = data;
      queryClient.setQueryData<Comment[]>(
        ["comments", variables.postId],
        (old) =>
          old?.map((comment) =>
            comment.id === variables.commentId
              ? { ...comment, liked, likeCount }
              : comment
          ) || []
      );
    },
    onError: (err, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", variables.postId],
          context.previousComments
        );
      }
      toast({
        title: "Error",
        description: err.message || "Failed to like comment",
        variant: "destructive",
      });
    },
  });
}

/**
 * Mark comment as helpful/unhelpful with optimistic update
 * Instantly toggles helpful state and updates count in UI
 * Uses server response data to prevent flicker and ensure accuracy
 */
export function useHelpfulComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      postId: _postId,
    }: {
      commentId: string;
      postId: string;
    }) => {
      // Get token from localStorage for authentication
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/comments/${commentId}/helpful`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to mark comment as helpful");
      return response.json();
    },
    onMutate: async ({ commentId, postId }) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });

      // Snapshot previous value for rollback on error
      const previousComments = queryClient.getQueryData<Comment[]>([
        "comments",
        postId,
      ]);

      // Optimistically update - toggle helpful state and adjust count
      if (previousComments) {
        queryClient.setQueryData<Comment[]>(
          ["comments", postId],
          (old) =>
            old?.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    helpfulCount: comment.helpful
                      ? Math.max(0, comment.helpfulCount - 1)
                      : comment.helpfulCount + 1,
                    helpful: !comment.helpful,
                  }
                : comment
            ) || []
        );
      }

      return { previousComments };
    },
    onSuccess: (data, variables) => {
      // Update cache with authoritative server response
      // This prevents flicker by not triggering a refetch
      const { helpful, helpfulCount } = data;
      queryClient.setQueryData<Comment[]>(
        ["comments", variables.postId],
        (old) =>
          old?.map((comment) =>
            comment.id === variables.commentId
              ? { ...comment, helpful, helpfulCount }
              : comment
          ) || []
      );
    },
    onError: (err, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", variables.postId],
          context.previousComments
        );
      }
      toast({
        title: "Error",
        description: err.message || "Failed to mark comment as helpful",
        variant: "destructive",
      });
    },
  });
}
