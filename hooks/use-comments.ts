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
import { useAuth } from "@/hooks/use-auth";
export function useComments(postId: string) {
  const { data: auth } = useAuth();
  const userId = auth?.user?.id || null;
  return useQuery({
    queryKey: ["comments", postId, userId],
    queryFn: async () => {
      // NextAuth cookies are sent automatically
      const response = await fetch(`/api/comments/post/${postId}`, {
        credentials: "include",
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
      // NextAuth cookies are sent automatically
      // Create FormData for file upload support
      const formData = new FormData();
      formData.append("content", data.content);
      if (data.parentId) formData.append("parentId", data.parentId);
      if (data.imageUrl) formData.append("imageUrl", data.imageUrl);
      if (data.fileId) formData.append("fileId", data.fileId);

      const response = await fetch(`/api/comments/post/${data.postId}`, {
        method: "POST",
        credentials: "include",
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
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({
        queryKey: ["comments", newComment.postId],
      });

      const previousComments = queryClient.getQueryData<Comment[]>([
        "comments",
        newComment.postId,
      ]);

      const completeComment: Comment = {
        id: "temp-id-" + Math.random().toString(36).substr(2, 9), // Temporary ID
        author: {
          id: "temp-user-id",
          name: "Temporary User",
        },
        content: newComment.content,
        createdAt: new Date(),
        likeCount: 0,
        helpfulCount: 0,
        liked: false,
        helpful: false,
        parentId: newComment.parentId,
        imageUrl: newComment.imageUrl,
        replies: [],
        postId: newComment.postId,
      };

      if (previousComments) {
        const updatedComments = completeComment.parentId
          ? addNestedComment(previousComments, completeComment)
          : [...previousComments, completeComment];

        queryClient.setQueryData<Comment[]>(
          ["comments", newComment.postId],
          updatedComments
        );
      }

      return { previousComments };
    },
    onError: (error, newComment, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", newComment.postId],
          context.previousComments
        );
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
    },
  });
}

/**
 * Update an existing comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation<
    Comment,
    Error,
    { id: string; content: string; postId: string }
  >({
    mutationFn: async ({
      id,
      content,
      postId: _postId,
    }: {
      id: string;
      content: string;
      postId: string;
    }) => {
      const response = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
    onSuccess: (data, variables) => {
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

      // Invalidate for background refetch
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
        refetchType: "none",
      });
      queryClient.refetchQueries({
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
      // NextAuth cookies are sent automatically
      const response = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
        credentials: "include",
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
      await queryClient.cancelQueries({
        queryKey: ["comments", postId],
      });

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
      queryClient.refetchQueries({
        queryKey: ["comments", variables.postId],
      });
      queryClient.refetchQueries({
        queryKey: ["post", variables.postId],
      });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
        variant: "success",
      });
    },
  });
}

// Updated updateNestedComments to handle empty cache more robustly
function updateNestedComments(
  comments: Comment[] = [],
  commentId: string,
  updater: (comment: Comment) => Comment
): Comment[] {
  if (!comments || comments.length === 0) {
    console.warn("updateNestedComments: No comments to update.");
    return comments; // Return as is if no comments exist
  }

  return comments.map((comment) => {
    if (comment.id === commentId) {
      return updater(comment);
    }
    if (comment.replies) {
      return {
        ...comment,
        replies: updateNestedComments(comment.replies, commentId, updater),
      };
    }
    return comment;
  });
}

// Helper function to add a new comment to a nested structure
function addNestedComment(comments: Comment[], newComment: Comment): Comment[] {
  return comments.map((comment) => {
    if (comment.id === newComment.parentId) {
      return {
        ...comment,
        replies: comment.replies
          ? [...comment.replies, newComment]
          : [newComment],
      };
    }
    if (comment.replies) {
      return {
        ...comment,
        replies: addNestedComment(comment.replies, newComment),
      };
    }
    return comment;
  });
}

/**
 * Toggle like status for a comment
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
      console.log(`Toggling like for comment: ${commentId}`);
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || error.message || "Failed to like comment"
        );
      }
      const data = await response.json();
      console.log("Server response for like toggle:", data);
      return data;
    },
    onMutate: async ({ commentId, postId }) => {
      console.log(`Optimistically updating like for comment: ${commentId}`);
      // Cancel all comment queries for this post (regardless of userId in query key)
      await queryClient.cancelQueries({
        queryKey: ["comments", postId],
        exact: false, // Match all queries starting with ["comments", postId]
      });

      // Get all comment queries for this post (may have different userIds in key)
      const allCommentQueries = queryClient.getQueriesData<Comment[]>({
        queryKey: ["comments", postId],
        exact: false,
      });

      // Snapshot previous values for rollback
      // Filter out undefined values and type explicitly
      const previousCommentsQueries: Array<[readonly unknown[], Comment[]]> =
        allCommentQueries
          .filter(
            (entry): entry is [readonly unknown[], Comment[]] =>
              entry[1] !== undefined
          )
          .map(([queryKey, data]) => [queryKey, data]);

      // Optimistically update ALL comment queries for this post
      allCommentQueries.forEach(([queryKey, previousComments]) => {
        if (!previousComments) {
          console.warn(
            `No previous comments found in cache for key: ${JSON.stringify(
              queryKey
            )}. Skipping.`
          );
          return;
        }

        const updatedComments = updateNestedComments(
          previousComments,
          commentId,
          (comment) => {
            const isLiked = !comment.liked; // Toggle liked state
            return {
              ...comment,
              liked: isLiked,
              likeCount: isLiked
                ? comment.likeCount + 1
                : comment.likeCount - 1,
            };
          }
        );
        queryClient.setQueryData(queryKey, updatedComments);
      });

      console.log("Optimistically updated all comment queries");

      return { previousCommentsQueries };
    },
    onSuccess: (data, { commentId, postId }) => {
      console.log("Server response for like toggle:", data);

      // Update cache with authoritative server response
      // This prevents flicker by not triggering a refetch
      const { liked, likeCount } = data;

      // Update ALL comment queries for this post (regardless of userId in query key)
      queryClient.setQueriesData<Comment[]>(
        { queryKey: ["comments", postId], exact: false },
        (old) => {
          if (!old) return old;
          return updateNestedComments(old, commentId, (comment) => ({
            ...comment,
            liked,
            likeCount,
          }));
        }
      );
    },
    onError: (err, { postId: _postId }, context) => {
      console.error("Error toggling like:", err);

      // Rollback to previous state
      if (context?.previousCommentsQueries) {
        context.previousCommentsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData<Comment[]>(queryKey, data);
        });
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
 * Toggle helpful status for a comment
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
      console.log(`Toggling helpful for comment: ${commentId}`);
      const response = await fetch(`/api/comments/${commentId}/helpful`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || error.message || "Failed to mark comment as helpful"
        );
      }
      const data = await response.json();
      console.log("Server response for helpful toggle:", data);
      return data;
    },
    onMutate: async ({ commentId, postId }) => {
      console.log(`Optimistically updating helpful for comment: ${commentId}`);
      // Cancel all comment queries for this post (regardless of userId in query key)
      await queryClient.cancelQueries({
        queryKey: ["comments", postId],
        exact: false, // Match all queries starting with ["comments", postId]
      });

      // Get all comment queries for this post (may have different userIds in key)
      const allCommentQueries = queryClient.getQueriesData<Comment[]>({
        queryKey: ["comments", postId],
        exact: false,
      });

      // Snapshot previous values for rollback
      // Filter out undefined values and type explicitly
      const previousCommentsQueries: Array<[readonly unknown[], Comment[]]> =
        allCommentQueries
          .filter(
            (entry): entry is [readonly unknown[], Comment[]] =>
              entry[1] !== undefined
          )
          .map(([queryKey, data]) => [queryKey, data]);

      // Optimistically update ALL comment queries for this post
      allCommentQueries.forEach(([queryKey, previousComments]) => {
        if (!previousComments) {
          console.warn(
            `No previous comments found in cache for key: ${JSON.stringify(
              queryKey
            )}. Skipping.`
          );
          return;
        }

        const updatedComments = updateNestedComments(
          previousComments,
          commentId,
          (comment) => {
            const isHelpful = !comment.helpful; // Toggle helpful state
            return {
              ...comment,
              helpful: isHelpful,
              helpfulCount: isHelpful
                ? comment.helpfulCount + 1
                : comment.helpfulCount - 1,
            };
          }
        );
        queryClient.setQueryData(queryKey, updatedComments);
      });

      console.log("Optimistically updated all comment queries");

      return { previousCommentsQueries };
    },
    onSuccess: (data, { commentId, postId }) => {
      console.log("Server response for helpful toggle:", data);

      // Update cache with authoritative server response
      // This prevents flicker by not triggering a refetch
      const { helpful, helpfulCount } = data;

      // Update ALL comment queries for this post (regardless of userId in query key)
      queryClient.setQueriesData<Comment[]>(
        { queryKey: ["comments", postId], exact: false },
        (old) => {
          if (!old) return old;
          return updateNestedComments(old, commentId, (comment) => ({
            ...comment,
            helpful,
            helpfulCount,
          }));
        }
      );
    },
    onError: (err, { postId: _postId }, context) => {
      console.error("Error toggling helpful:", err);

      // Rollback to previous state
      if (context?.previousCommentsQueries) {
        context.previousCommentsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData<Comment[]>(queryKey, data);
        });
      }

      toast({
        title: "Error",
        description: err.message || "Failed to mark comment as helpful",
        variant: "destructive",
      });
    },
  });
}
