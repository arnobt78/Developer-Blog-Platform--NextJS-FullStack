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
import { useAuth } from "@/hooks/use-auth";

/**
 * Fetch all posts with optional filters
 *
 * @param params - Optional filters: tag, search query, or authorId
 * @returns React Query hook with posts data, loading state, and error
 */
export function usePosts(params?: {
  tag?: string;
  search?: string;
  authorId?: string;
}) {
  const { data: auth } = useAuth();
  const userId = auth?.user?.id || null;
  return useQuery({
    queryKey: ["posts", params, userId],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.tag) searchParams.set("tag", params.tag);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.authorId) searchParams.set("authorId", params.authorId);

      const url = `/api/posts${
        searchParams.toString() ? `?${searchParams}` : ""
      }`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json() as Promise<Post[]>;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes for real-time updates
  });
}

/**
 * Fetch a single post by ID
 * Includes Authorization header to get user-specific liked/helpful status
 */
export function usePost(id: string) {
  const { data: auth } = useAuth();
  const userId = auth?.user?.id || null;
  return useQuery({
    queryKey: ["post", id, userId],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${id}`, {
        credentials: "include",
      });
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
 */
export function useSavedPosts(options?: { enabled?: boolean }) {
  const { data: auth } = useAuth();
  const userId = auth?.user?.id || null;
  return useQuery({
    queryKey: ["saved-posts", userId],
    queryFn: async () => {
      const response = await fetch("/api/users/me/saved-posts", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          return [];
        }
        throw new Error("Failed to fetch saved posts");
      }
      return response.json() as Promise<Post[]>;
    },
    staleTime: 2 * 60 * 1000,
    enabled: options?.enabled !== false,
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
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || "Failed to create post"
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      toast({
        title: "Post created!",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      toast({
        title: "Post updated!",
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
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(key, data);
          }
        });
      }
      if (context?.previousSavedPostsQueries) {
        context.previousSavedPostsQueries.forEach(([key, data]) => {
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(key, data);
          }
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
      console.log("Toggling like for post:", postId);

      // Cancel outgoing refetches to prevent race conditions
      // Use exact: false to match all variations of the query key (with or without userId)
      await queryClient.cancelQueries({
        queryKey: ["post", postId],
        exact: false,
      });
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["saved-posts"] });

      // Get all single post queries (may have different userIds in query key)
      const allPostQueries = queryClient.getQueriesData<Post>({
        queryKey: ["post", postId],
        exact: false,
      });

      // Snapshot the current values for potential rollback
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["saved-posts"],
      });

      // Optimistically update ALL single post cache variations (with or without userId)
      allPostQueries.forEach(([queryKey, previousPost]) => {
        if (previousPost) {
          queryClient.setQueryData<Post>(queryKey, {
            ...previousPost,
            likes: previousPost.liked
              ? Math.max(0, previousPost.likes - 1)
              : previousPost.likes + 1,
            liked: !previousPost.liked,
          });
        }
      });

      // Store first post query for rollback (if exists)
      const previousPost = allPostQueries[0]?.[1] || null;

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
        allPostQueries, // Store all post queries for rollback
      };
    },
    onSuccess: (data, postId) => {
      console.log("Server response for like toggle:", data);

      // Update cache with authoritative server response
      // This prevents flicker by not triggering a refetch
      const { liked, likes } = data;

      // Update ALL single post cache variations (with or without userId in query key)
      queryClient.setQueriesData<Post>(
        { queryKey: ["post", postId], exact: false },
        (old) => (old ? { ...old, liked, likes } : old)
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
      // Rollback all single post query variations
      if (context?.allPostQueries) {
        context.allPostQueries.forEach(([queryKey, data]) => {
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      // Rollback all posts queries
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([queryKey, data]) => {
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      // Rollback all saved-posts queries
      if (context?.previousSavedPostsQueries) {
        context.previousSavedPostsQueries.forEach(([queryKey, data]) => {
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
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
      console.log("Toggling helpful for post:", postId);

      // Cancel outgoing refetches to prevent race conditions
      // Use exact: false to match all variations of the query key (with or without userId)
      await queryClient.cancelQueries({
        queryKey: ["post", postId],
        exact: false,
      });
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["saved-posts"] });

      // Get all single post queries (may have different userIds in query key)
      const allPostQueries = queryClient.getQueriesData<Post>({
        queryKey: ["post", postId],
        exact: false,
      });

      // Snapshot the current values for potential rollback
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["saved-posts"],
      });

      // Optimistically update ALL single post cache variations (with or without userId)
      allPostQueries.forEach(([queryKey, previousPost]) => {
        if (previousPost) {
          queryClient.setQueryData<Post>(queryKey, {
            ...previousPost,
            helpfulCount: previousPost.helpful
              ? Math.max(0, previousPost.helpfulCount - 1)
              : previousPost.helpfulCount + 1,
            helpful: !previousPost.helpful,
          });
        }
      });

      // Store first post query for rollback (if exists)
      const previousPost = allPostQueries[0]?.[1] || null;

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
        allPostQueries, // Store all post queries for rollback
      };
    },
    onSuccess: (data, postId) => {
      console.log("Server response for helpful toggle:", data);

      // Update cache with authoritative server response
      // This prevents flicker by not triggering a refetch
      const { helpful, helpfulCount } = data;

      // Update ALL single post cache variations (with or without userId in query key)
      queryClient.setQueriesData<Post>(
        { queryKey: ["post", postId], exact: false },
        (old) => (old ? { ...old, helpful, helpfulCount } : old)
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
      // Rollback all single post query variations
      if (context?.allPostQueries) {
        context.allPostQueries.forEach(([queryKey, data]) => {
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      // Rollback all posts queries
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([queryKey, data]) => {
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      // Rollback all saved-posts queries
      if (context?.previousSavedPostsQueries) {
        context.previousSavedPostsQueries.forEach(([queryKey, data]) => {
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
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
      const previousPost = queryClient.getQueryData<Post>(["post", postId]);
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPosts = queryClient.getQueryData<Post[]>([
        "saved-posts",
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
      };
    },
    onSuccess: (data, postId, _context) => {
      // Update with server response if available
      if (data) {
        queryClient.setQueryData<Post>(["post", postId], (old) =>
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
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([queryKey, data]) => {
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      if (context?.previousSavedPosts) {
        queryClient.setQueryData(["saved-posts"], context.previousSavedPosts);
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
      const previousPost = queryClient.getQueryData<Post>(["post", postId]);
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPosts = queryClient.getQueryData<Post[]>([
        "saved-posts",
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
      };
    },
    onSuccess: (data, postId, _context) => {
      // Update with server response if available
      if (data) {
        queryClient.setQueryData<Post>(["post", postId], (old) =>
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
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([queryKey, data]) => {
          // Only set query data if data exists (not undefined)
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
      if (context?.previousSavedPosts) {
        queryClient.setQueryData(["saved-posts"], context.previousSavedPosts);
      }

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
