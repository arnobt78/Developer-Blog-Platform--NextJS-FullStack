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
    onSuccess: (data, formData) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      const title =
        data?.title ||
        (formData instanceof FormData
          ? formData.get("headline")?.toString()
          : null) ||
        "Your post";
      const truncatedTitle =
        title.length > 50 ? title.substring(0, 50) + "..." : title;
      toast({
        title: "🎉 Post Published!",
        description: `"${truncatedTitle}" has been shared with the community!`,
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Oops! 😅",
        description:
          error.message || "Failed to create your post. Please try again.",
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
    mutationKey: ["updatePost"],
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
    onMutate: async ({ id, formData }) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["post", id], exact: false });
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["saved-posts"] });

      // Snapshot the previous values for potential rollback
      const previousPost = queryClient.getQueryData<Post>(["post", id]);
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["saved-posts"],
      });

      // Optimistically update single post cache
      if (previousPost) {
        const updatedPost: Partial<Post> = {
          ...previousPost,
          title:
            (formData.get("title") as string) ||
            (formData.get("headline") as string) ||
            previousPost.title,
          description:
            (formData.get("errorDescription") as string) ||
            previousPost.description,
          content:
            (formData.get("content") as string) ||
            (formData.get("solution") as string) ||
            previousPost.content,
          codeSnippet:
            (formData.get("codeSnippet") as string) || previousPost.codeSnippet,
          tags: formData.get("tags")
            ? JSON.parse(formData.get("tags") as string)
            : previousPost.tags,
        };

        // Handle image URL - preserve existing if not provided, update if provided
        const imageUrl = formData.get("imageUrl") as string | null;
        if (imageUrl !== null && imageUrl !== undefined) {
          // If imageUrl is empty string, it means image was removed
          updatedPost.imageUrl = imageUrl || undefined;
        } else {
          // Preserve existing imageUrl if not provided in formData
          updatedPost.imageUrl = previousPost.imageUrl;
        }

        queryClient.setQueryData<Post>(["post", id], (old) =>
          old ? { ...old, ...updatedPost } : old
        );
      }

      // Optimistically update posts list cache
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old?.map((post) =>
          post.id === id
            ? {
                ...post,
                title:
                  (formData.get("title") as string) ||
                  (formData.get("headline") as string) ||
                  post.title,
                description:
                  (formData.get("errorDescription") as string) ||
                  post.description,
                content:
                  (formData.get("content") as string) ||
                  (formData.get("solution") as string) ||
                  post.content,
                codeSnippet:
                  (formData.get("codeSnippet") as string) || post.codeSnippet,
                tags: formData.get("tags")
                  ? JSON.parse(formData.get("tags") as string)
                  : post.tags,
                imageUrl:
                  formData.get("imageUrl") !== null
                    ? (formData.get("imageUrl") as string) || undefined
                    : post.imageUrl,
              }
            : post
        )
      );

      // Optimistically update saved-posts cache
      queryClient.setQueriesData<Post[]>({ queryKey: ["saved-posts"] }, (old) =>
        old?.map((post) =>
          post.id === id
            ? {
                ...post,
                title:
                  (formData.get("title") as string) ||
                  (formData.get("headline") as string) ||
                  post.title,
                description:
                  (formData.get("errorDescription") as string) ||
                  post.description,
                content:
                  (formData.get("content") as string) ||
                  (formData.get("solution") as string) ||
                  post.content,
                codeSnippet:
                  (formData.get("codeSnippet") as string) || post.codeSnippet,
                tags: formData.get("tags")
                  ? JSON.parse(formData.get("tags") as string)
                  : post.tags,
                imageUrl:
                  formData.get("imageUrl") !== null
                    ? (formData.get("imageUrl") as string) || undefined
                    : post.imageUrl,
              }
            : post
        )
      );

      return {
        previousPost,
        previousPostsQueries,
        previousSavedPostsQueries,
      };
    },
    onSuccess: (data, variables) => {
      // Update cache with authoritative server response
      const { id } = variables;

      // Update single post cache with server response
      queryClient.setQueriesData<Post>(
        { queryKey: ["post", id], exact: false },
        (old) => (old ? { ...old, ...data } : old)
      );

      // Update posts list cache with server response
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old?.map((post) => (post.id === id ? { ...post, ...data } : post))
      );

      // Update saved-posts cache with server response
      queryClient.setQueriesData<Post[]>({ queryKey: ["saved-posts"] }, (old) =>
        old?.map((post) => (post.id === id ? { ...post, ...data } : post))
      );

      // Invalidate queries for background refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["post", id], exact: false });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });

      const title =
        data?.title ||
        (variables.formData instanceof FormData
          ? variables.formData.get("headline")?.toString()
          : null) ||
        "Your post";
      const truncatedTitle =
        title.length > 50 ? title.substring(0, 50) + "..." : title;
      toast({
        title: "✨ Post Updated!",
        description: `"${truncatedTitle}" has been updated successfully!`,
        variant: "success",
      });
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      const { id } = variables;

      if (context?.previousPost) {
        queryClient.setQueryData<Post>(["post", id], context.previousPost);
      }

      if (context?.previousPostsQueries) {
        context.previousPostsQueries.forEach(([queryKey, data]) => {
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }

      if (context?.previousSavedPostsQueries) {
        context.previousSavedPostsQueries.forEach(([queryKey, data]) => {
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }

      toast({
        title: "Oops! 😅",
        description:
          error.message || "Failed to update your post. Please try again.",
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

      // Get post title before removing (for toast message)
      let postTitle = "Your post";
      for (const [, posts] of previousPostsQueries) {
        if (posts) {
          const post = posts.find((p) => p.id === id);
          if (post?.title) {
            postTitle = post.title;
            break;
          }
        }
      }

      // Optimistically remove the post from all lists using prefix matching
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old ? old.filter((post) => post.id !== id) : old
      );
      queryClient.setQueriesData<Post[]>({ queryKey: ["saved-posts"] }, (old) =>
        old ? old.filter((post) => post.id !== id) : old
      );

      return { previousPostsQueries, previousSavedPostsQueries, postTitle };
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
        title: "Oops! 😅",
        description:
          error.message || "Failed to delete your post. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data, id, context) => {
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

      // Use post title from context (saved before deletion)
      const postTitle = context?.postTitle || "Your post";
      const truncatedTitle =
        postTitle.length > 50 ? postTitle.substring(0, 50) + "..." : postTitle;
      toast({
        title: "🗑️ Post Deleted",
        description: `"${truncatedTitle}" has been removed successfully.`,
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
      // Use exact: false to match all variations of query keys (with or without userId)
      await queryClient.cancelQueries({
        queryKey: ["post", postId],
        exact: false,
      });
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({
        queryKey: ["saved-posts"],
        exact: false,
      });

      // Snapshot the current values for potential rollback
      const previousPost = queryClient.getQueryData<Post>(["post", postId]);
      const previousPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["posts"],
      });
      const previousSavedPostsQueries = queryClient.getQueriesData<Post[]>({
        queryKey: ["saved-posts"],
        exact: false, // Match all saved-posts queries (with or without userId)
      });

      // Optimistically update single post cache - mark as unsaved
      // Update all variations of single post query (with or without userId)
      queryClient.setQueriesData<Post>(
        { queryKey: ["post", postId], exact: false },
        (old) => (old ? { ...old, saved: false } : old)
      );

      // Optimistically update ALL posts queries - mark as unsaved
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
        old?.map((post) =>
          post.id === postId ? { ...post, saved: false } : post
        )
      );

      // Optimistically remove from ALL saved-posts cache variations (with or without userId)
      queryClient.setQueriesData<Post[]>(
        { queryKey: ["saved-posts"], exact: false },
        (old) => old?.filter((post) => post.id !== postId)
      );

      return {
        previousPost,
        previousPostsQueries,
        previousSavedPostsQueries,
      };
    },
    onSuccess: (data, postId, _context) => {
      // Update with server response if available
      if (data) {
        // Update all variations of single post query (with or without userId)
        queryClient.setQueriesData<Post>(
          { queryKey: ["post", postId], exact: false },
          (old) => (old ? { ...old, saved: data.saved } : old)
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
        exact: false, // Invalidate all saved-posts queries
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
        refetchType: "none",
      });
      queryClient.refetchQueries({ queryKey: ["saved-posts"], exact: false });
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
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
