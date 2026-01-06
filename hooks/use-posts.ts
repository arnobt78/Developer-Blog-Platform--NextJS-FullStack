/**
 * Custom React Query hooks for posts
 * Provides caching, optimistic updates, and automatic refetching
 * 
 * React Query Benefits:
 * - Automatic caching reduces API calls
 * - Background refetching keeps data fresh
 * - Optimistic updates provide instant UI feedback
 * - Error handling and retry logic built-in
 * - Loading states managed automatically
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { Post } from "@/types";

/**
 * Fetch all posts with optional filters
 * 
 * @param params - Optional filters: tag, search query, or authorId
 * @returns React Query hook with posts data, loading state, and error
 * 
 * How it works:
 * 1. queryKey: ["posts", params] - Unique cache key based on filters
 *    - Different params = different cache entries
 *    - Same params = returns cached data instantly
 * 2. queryFn: Async function that fetches data from API
 * 3. staleTime: Data considered fresh for 5 minutes
 *    - During this time, no refetch occurs
 *    - After staleTime, data refetches in background
 */
export function usePosts(params?: {
  tag?: string;
  search?: string;
  authorId?: string;
}) {
  return useQuery({
    queryKey: ["posts", params], // Cache key - changing params creates new cache entry
    queryFn: async () => {
      // Build query string from optional parameters
      const searchParams = new URLSearchParams();
      if (params?.tag) searchParams.set("tag", params.tag);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.authorId) searchParams.set("authorId", params.authorId);

      const url = `/api/posts${
        searchParams.toString() ? `?${searchParams}` : ""
      }`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json() as Promise<Post[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh, no refetch needed
  });
}

/**
 * Fetch a single post by ID
 */
export function usePost(id: string) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${id}`);
      if (!response.ok) throw new Error("Failed to fetch post");
      return response.json() as Promise<Post>;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch saved posts for current user
 */
export function useSavedPosts() {
  return useQuery({
    queryKey: ["saved-posts"],
    queryFn: async () => {
      const response = await fetch("/api/users/saved-posts");
      if (!response.ok) throw new Error("Failed to fetch saved posts");
      return response.json() as Promise<Post[]>;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create a new post
 * 
 * Mutation Pattern:
 * - mutationFn: Performs the API call
 * - onSuccess: Invalidates related queries and shows success toast
 * - onError: Shows error toast
 * 
 * Cache Invalidation:
 * - After creating a post, we invalidate "posts" query
 * - This triggers a refetch, showing the new post in the list
 * - Also invalidate "saved-posts" in case user wants to save it
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      // FormData is used to support file uploads (screenshots)
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData, // FormData includes text fields + file uploads
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create post");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to trigger refetch
      // This ensures the new post appears in lists immediately
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      toast({
        title: "Success",
        description: "Post created successfully",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      // Show user-friendly error message
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Update an existing post
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: FormData;
    }) => {
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update post");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      toast({
        title: "Success",
        description: "Post updated successfully",
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
 * Delete a post
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete post");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
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
 * Like/unlike a post with optimistic update
 * 
 * Optimistic Update Pattern:
 * 1. onMutate: Update UI immediately (before server responds)
 *    - Cancel any pending queries to prevent race conditions
 *    - Save current state as snapshot for rollback
 *    - Apply optimistic update to cache
 * 2. onError: If server request fails, rollback to previous state
 * 3. onSettled: Always refetch to sync with server (success or error)
 * 
 * Benefits:
 * - Instant UI feedback (feels faster)
 * - Automatic rollback on error
 * - Always syncs with server eventually
 */
export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      // Actual API call to like/unlike post
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to like post");
      return response.json();
    },
    onMutate: async (postId) => {
      // Step 1: Cancel any outgoing refetches to prevent race conditions
      // This ensures our optimistic update doesn't get overwritten
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      // Step 2: Snapshot the current value for potential rollback
      // If the mutation fails, we'll restore this value
      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      // Step 3: Optimistically update the cache
      // UI updates instantly, user sees immediate feedback
      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          // Toggle like count: increment if not liked, decrement if liked
          likes: previousPost.liked
            ? Math.max(0, previousPost.likes - 1) // Prevent negative counts
            : previousPost.likes + 1,
          liked: !previousPost.liked, // Toggle liked state
        });
      }

      // Return context for error handling
      return { previousPost };
    },
    onError: (err, postId, context) => {
      // If mutation fails, rollback to previous state
      // This ensures UI always reflects actual server state
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },
    onSettled: (data, error, postId) => {
      // Always refetch after mutation completes (success or error)
      // This ensures we're in sync with the server
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // Also update posts list
    },
  });
}

/**
 * Mark post as helpful with optimistic update
 */
export function useMarkHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/helpful`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to mark helpful");
      return response.json();
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          helpfulCount: previousPost.helpful
            ? Math.max(0, previousPost.helpfulCount - 1)
            : previousPost.helpfulCount + 1,
          helpful: !previousPost.helpful,
        });
      }

      return { previousPost };
    },
    onError: (err, postId, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },
    onSettled: (data, error, postId) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/**
 * Save a post
 */
export function useSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to save post");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Success",
        description: "Post saved successfully",
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
 * Unsave a post
 */
export function useUnsavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/unsave`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to unsave post");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({
        title: "Success",
        description: "Post unsaved successfully",
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
