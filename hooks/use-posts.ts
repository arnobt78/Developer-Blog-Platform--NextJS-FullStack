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
    queryKey: [
      "posts",
      params,
    ], // Include token in key to refetch on auth change
    queryFn: async () => {

      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Build query string from optional parameters
      const searchParams = new URLSearchParams();
      if (params?.tag) searchParams.set("tag", params.tag);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.authorId) searchParams.set("authorId", params.authorId);

      const url = `/api/posts${
        searchParams.toString() ? `?${searchParams}` : ""
      }`;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json() as Promise<Post[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh, no refetch needed
  });
}

/**
 * Fetch a single post by ID
 * Includes Authorization header to get user-specific liked/helpful status
 */
export function usePost(id: string) {
  return useQuery({
    queryKey: [
      "post",
      id,
    ], // Include token to refetch on auth change
    queryFn: async () => {

      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/posts/${id}`, { headers });
      if (!response.ok) throw new Error("Failed to fetch post");
      return response.json() as Promise<Post>;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch saved posts for current user
 *
 * @param options - Optional query options
 * @param options.enabled - Whether to enable the query (default: true)
 *                        Set to false to skip fetching when user is not authenticated
 */
export function useSavedPosts(options?: { enabled?: boolean }) {

  return useQuery({
    queryKey: ["saved-posts"],
    queryFn: async () => {
      // If no token, return empty array (user not authenticated)
      if (!token) {
        return [];
      }

      const response = await fetch("/api/users/me/saved-posts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        // Return empty array if not authenticated or error
        if (response.status === 401 || response.status === 404) {
          return [];
        }
        throw new Error("Failed to fetch saved posts");
      }
      return response.json() as Promise<Post[]>;
    },
    staleTime: 2 * 60 * 1000,
    enabled: options?.enabled !== false, // Default to true, but can be disabled
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
      // NextAuth cookies are sent automatically - no token needed!
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData, // FormData includes text fields + file uploads
        credentials: "include", // Ensure cookies are sent
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Failed to create post"
        );
      }
      return response.json();
    },
    onSettled: (data, _error) => {
      // Add new post to cache immediately if successful
      if (data) {
        // Get token for cache key
        const _token =

        // Update all posts queries with prefix matching
        queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
          old ? [data, ...old] : [data]
        );
      }
    },
    onSuccess: () => {
      // Cache already updated in onSettled
      // Now invalidate for background refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["saved-posts"],
        refetchType: "none",
      });
      // Background refetch (non-blocking)
      queryClient.refetchQueries({ queryKey: ["posts"] });
      queryClient.refetchQueries({ queryKey: ["saved-posts"] });
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
      // NextAuth cookies are sent automatically
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Failed to update post"
        );
      }
      return response.json();
    },
    onMutate: async ({ id }) => {
      // Get token for cache keys

      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["post", id] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot previous values for rollback
      const previousPost = queryClient.getQueryData<Post>(["post", id]);
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });

      // Note: We can't read FormData here as it's already consumed
      // The optimistic update will be minimal - we'll just mark it as updating
      // The actual update will happen after server response via invalidateQueries
      // This prevents flicker by keeping the old data visible until new data arrives

      return { previousPost, previousPostsQueries };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousPost && context?.token) {
        queryClient.setQueryData(
          ["post", variables.id, context.token],
          context.previousPost
        );
      }
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      // onSettled runs after onSuccess/onError but before component re-renders
      // This ensures cache is fully updated before any navigation occurs
      if (data) {
        // Get token for cache keys

        // Update cache immediately with server response to prevent flicker
        queryClient.setQueryData<Post>(["post", variables.id], data);

        // Update all posts list caches with the new data using prefix matching
        queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
          old
            ? old.map((post) => (post.id === variables.id ? data : post))
            : old
        );

        // Update saved posts cache if the post is in there
        queryClient.setQueriesData<Post[]>(
          { queryKey: ["saved-posts"] },
          (old) =>
            old
              ? old.map((post) => (post.id === variables.id ? data : post))
              : old
        );
      }
    },
    onSuccess: (data, variables) => {
      // Cache is already updated in onSettled above
      // Now just invalidate for background refetch
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["post", variables.id],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["saved-posts"],
        refetchType: "none",
      });

      // Trigger background refetch (non-blocking)
      queryClient.refetchQueries({ queryKey: ["posts"] });
      queryClient.refetchQueries({ queryKey: ["post", variables.id] });
      queryClient.refetchQueries({ queryKey: ["saved-posts"] });

      toast({
        title: "Success",
        description: "Post updated successfully",
        variant: "success",
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
      // NextAuth cookies are sent automatically
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Failed to delete post"
        );
      }
      return response.json();
    },
    onMutate: async (id: string) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["saved-posts"] });

      // Snapshot previous values for rollback (get all queries with prefix)
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["saved-posts"],
      });

      // Optimistically remove the post from all lists using prefix matching
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old ? old.filter((post) => post.id !== id) : old
      );
      queryClient.setQueriesData<Post[]>({ queryKey: ["saved-posts"] }, (old) =>
        old ? old.filter((post) => post.id !== id) : old
      );

      return { previousPostsQueries, previousSavedPostsQueries };
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousSavedPostsQueries) {
        context.previousSavedPostsQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Cache already updated optimistically in onMutate
      // Now invalidate for background refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["saved-posts"],
        refetchType: "none",
      });
      // Background refetch (non-blocking)
      queryClient.refetchQueries({ queryKey: ["posts"] });
      queryClient.refetchQueries({ queryKey: ["saved-posts"] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
        variant: "success",
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
      // NextAuth cookies are sent automatically
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to like post");
      return response.json();
    },
    onMutate: async (postId) => {

      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["saved-posts"] });

      // Snapshot the current values for potential rollback
      const previousPost = queryClient.getQueryData<Post>([
        "post",
        postId,
        token,
      ]);
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["saved-posts"],
      });

      // Optimistically update single post cache
      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          likes: previousPost.liked
            ? Math.max(0, previousPost.likes - 1)
            : previousPost.likes + 1,
          liked: !previousPost.liked,
        });
      }

      // Optimistically update ALL posts list queries instantly
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: post.liked
                  ? Math.max(0, post.likes - 1)
                  : post.likes + 1,
                liked: !post.liked,
              }
            : post
        )
      );

      // Optimistically update ALL saved-posts queries instantly
      queryClient.setQueriesData<Post[]>({ queryKey: ["saved-posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: post.liked
                  ? Math.max(0, post.likes - 1)
                  : post.likes + 1,
                liked: !post.liked,
              }
            : post
        )
      );

      return {
        previousPost,
        previousPostsQueries,
        previousSavedPostsQueries,
        token,
      };
    },
    onSuccess: (data, postId, context) => {
      // Update cache with authoritative server response
      // This prevents flicker by not triggering a refetch
      const { liked, likes } = data;

      // Update single post cache
      queryClient.setQueryData<Post>(["post", postId, context?.token], (old) =>
        old ? { ...old, liked, likes } : old
      );

      // Update ALL posts queries (regardless of params) with matching postId
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId ? { ...post, liked, likes } : post
        )
      );

      // Update ALL saved-posts queries with matching postId
      queryClient.setQueriesData<Post[]>({ queryKey: ["saved-posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId ? { ...post, liked, likes } : post
        )
      );
    },
    onError: (err, postId, context) => {
      // If mutation fails, rollback to previous state
      if (context?.previousPost) {
        queryClient.setQueryData(
          ["post", postId, context.token],
          context.previousPost
        );
      }
      // Rollback all posts queries
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // Rollback all saved-posts queries
      if (context?.previousSavedPostsQueries) {
        context.previousSavedPostsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast({
        title: "Error",
        description: err.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });
}

/**
 * Mark post as helpful with optimistic update
 * Uses server response to prevent flicker and ensure accuracy
 */
export function useMarkHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      // NextAuth cookies are sent automatically
      const response = await fetch(`/api/posts/${postId}/helpful`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to mark helpful");
      return response.json();
    },
    onMutate: async (postId) => {

      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["saved-posts"] });

      // Snapshot the current values for potential rollback
      const previousPost = queryClient.getQueryData<Post>([
        "post",
        postId,
        token,
      ]);
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["saved-posts"],
      });

      // Optimistically update single post cache
      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          helpfulCount: previousPost.helpful
            ? Math.max(0, previousPost.helpfulCount - 1)
            : previousPost.helpfulCount + 1,
          helpful: !previousPost.helpful,
        });
      }

      // Optimistically update ALL posts list queries instantly
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                helpfulCount: post.helpful
                  ? Math.max(0, post.helpfulCount - 1)
                  : post.helpfulCount + 1,
                helpful: !post.helpful,
              }
            : post
        )
      );

      // Optimistically update ALL saved-posts queries instantly
      queryClient.setQueriesData<Post[]>({ queryKey: ["saved-posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                helpfulCount: post.helpful
                  ? Math.max(0, post.helpfulCount - 1)
                  : post.helpfulCount + 1,
                helpful: !post.helpful,
              }
            : post
        )
      );

      return {
        previousPost,
        previousPostsQueries,
        previousSavedPostsQueries,
        token,
      };
    },
    onSuccess: (data, postId, context) => {
      // Update cache with authoritative server response
      // This prevents flicker by not triggering a refetch
      const { helpful, helpfulCount } = data;

      // Update single post cache
      queryClient.setQueryData<Post>(["post", postId, context?.token], (old) =>
        old ? { ...old, helpful, helpfulCount } : old
      );

      // Update ALL posts queries (regardless of params) with matching postId
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId ? { ...post, helpful, helpfulCount } : post
        )
      );

      // Update ALL saved-posts queries with matching postId
      queryClient.setQueriesData<Post[]>({ queryKey: ["saved-posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId ? { ...post, helpful, helpfulCount } : post
        )
      );
    },
    onError: (err, postId, context) => {
      // If mutation fails, rollback to previous state
      if (context?.previousPost) {
        queryClient.setQueryData(
          ["post", postId, context.token],
          context.previousPost
        );
      }
      // Rollback all posts queries
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // Rollback all saved-posts queries
      if (context?.previousSavedPostsQueries) {
        context.previousSavedPostsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast({
        title: "Error",
        description: err.message || "Failed to mark as helpful",
        variant: "destructive",
      });
    },
  });
}

/**
 * Save a post with optimistic update
 */
export function useSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      // NextAuth cookies are sent automatically
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to save post");
      return response.json();
    },
    onMutate: async (postId) => {

      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["saved-posts"] });

      // Snapshot the current values for potential rollback
      const previousPost = queryClient.getQueryData<Post>([
        "post",
        postId,
        token,
      ]);
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPosts = queryClient.getQueryData<Post[]>([
        "saved-posts",
        token,
      ]);

      // Optimistically update single post cache - mark as saved
      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          saved: true,
        });
      }

      // Optimistically update ALL posts queries - mark as saved
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId ? { ...post, saved: true } : post
        )
      );

      // Optimistically add to saved-posts cache if not already there
      const postToAdd =
        previousPost ||
        previousPostsQueries
          .flatMap(([, data]) => data || [])
          .find((p) => p.id === postId);

      if (postToAdd) {
        queryClient.setQueryData<Post[]>(["saved-posts"], (old) => {
          const exists = old?.some((p) => p.id === postId);
          if (exists) return old;
          return old
            ? [{ ...postToAdd, saved: true }, ...old]
            : [{ ...postToAdd, saved: true }];
        });
      }

      return {
        previousPost,
        previousPostsQueries,
        previousSavedPosts,
        token,
      };
    },
    onSuccess: (data, postId, context) => {
      // Update with server response if available
      if (data && context?.token) {
        queryClient.setQueryData<Post>(["post", postId, context.token], (old) =>
          old ? { ...old, saved: data.saved } : old
        );

        queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
          old?.map((post) =>
            post.id === postId ? { ...post, saved: data.saved } : post
          )
        );
      }

      // Background refetch for consistency
      queryClient.invalidateQueries({
        queryKey: ["saved-posts"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "none",
      });
      queryClient.refetchQueries({ queryKey: ["saved-posts"] });
      queryClient.refetchQueries({ queryKey: ["posts"] });

      toast({
        title: "Success",
        description: "Post saved successfully",
        variant: "success",
      });
    },
    onError: (error: Error, postId, context) => {
      // Rollback on error
      if (context?.previousPost && context?.token) {
        queryClient.setQueryData(
          ["post", postId, context.token],
          context.previousPost
        );
      }
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousSavedPosts && context?.token) {
        queryClient.setQueryData(
          ["saved-posts", context.token],
          context.previousSavedPosts
        );
      }

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Unsave a post with optimistic update
 */
export function useUnsavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      // NextAuth cookies are sent automatically
      const response = await fetch(`/api/posts/${postId}/unsave`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to unsave post");
      return response.json();
    },
    onMutate: async (postId) => {

      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["saved-posts"] });

      // Snapshot the current values for potential rollback
      const previousPost = queryClient.getQueryData<Post>([
        "post",
        postId,
        token,
      ]);
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPosts = queryClient.getQueryData<Post[]>([
        "saved-posts",
        token,
      ]);

      // Optimistically update single post cache - mark as unsaved
      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          saved: false,
        });
      }

      // Optimistically update ALL posts queries - mark as unsaved
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId ? { ...post, saved: false } : post
        )
      );

      // Optimistically remove from saved-posts cache
      queryClient.setQueryData<Post[]>(["saved-posts"], (old) =>
        old?.filter((post) => post.id !== postId)
      );

      return {
        previousPost,
        previousPostsQueries,
        previousSavedPosts,
        token,
      };
    },
    onSuccess: (data, postId, context) => {
      // Update with server response if available
      if (data && context?.token) {
        queryClient.setQueryData<Post>(["post", postId, context.token], (old) =>
          old ? { ...old, saved: data.saved } : old
        );

        queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
          old?.map((post) =>
            post.id === postId ? { ...post, saved: data.saved } : post
          )
        );
      }

      // Background refetch for consistency
      queryClient.invalidateQueries({
        queryKey: ["saved-posts"],
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "none",
      });
      queryClient.refetchQueries({ queryKey: ["saved-posts"] });
      queryClient.refetchQueries({ queryKey: ["posts"] });

      toast({
        title: "Success",
        description: "Post unsaved successfully",
        variant: "success",
      });
    },
    onError: (error: Error, postId, context) => {
      // Rollback on error
      if (context?.previousPost && context?.token) {
        queryClient.setQueryData(
          ["post", postId, context.token],
          context.previousPost
        );
      }
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousSavedPosts && context?.token) {
        queryClient.setQueryData(
          ["saved-posts", context.token],
          context.previousSavedPosts
        );
      }

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
