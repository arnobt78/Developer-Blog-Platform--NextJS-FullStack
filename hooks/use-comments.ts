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
 */
export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const response = await fetch(`/api/comments/post/${postId}`);
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
        throw new Error(error.error || error.message || "Failed to create comment");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
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
        throw new Error(error.message || error.error || "Failed to update comment");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
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
        throw new Error(error.message || error.error || "Failed to delete comment");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
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
 * Like/unlike a comment with optimistic update
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>([
        "comments",
        postId,
      ]);

      // Optimistically update
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
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", variables.postId],
          context.previousComments
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
    },
  });
}
