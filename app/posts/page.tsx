/**
 * Posts Page - Main listing page for all posts
 *
 * Features:
 * - React Query for data fetching and caching
 * - Optimistic updates (likes, saves update instantly)
 * - Skeleton loading (prevents layout shift)
 * - URL-based filtering (tag, search query)
 * - Client-side filtering as fallback
 * - Sidebar with recent posts and popular topics
 *
 * React Query Benefits:
 * - Posts are cached, no refetch on navigation
 * - Background refetch keeps data fresh
 * - Optimistic updates provide instant feedback
 * - Loading states handled automatically
 */

"use client";

import React, { useState, useEffect, Suspense } from "react";
import PostCard from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { usePosts, useSavedPosts } from "@/hooks/use-posts";
import { useSession } from "next-auth/react";
import { useUser } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { useIsMutating } from "@tanstack/react-query";

/**
 * Posts content component that uses useSearchParams
 * Must be wrapped in Suspense boundary for Next.js static generation
 */
function PostsContent() {
  // Local state for tag filtering
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams(); // Get URL search params

  // Get search query from URL (e.g., /posts?search=react)
  const searchQuery = searchParams.get("search")?.toLowerCase() || null;
  
  // Get page number from URL (e.g., /posts?page=2), default to 1
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const postsPerPage = 10;

  // Check if user is authenticated
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";
  const isAuthenticated = !!session?.user && !isLoadingAuth;
  // Always fetch current user with useUser for latest info
  const { data: currentUser } = useUser(session?.user?.id);

  /**
   * React Query hooks
   *
   * usePosts: Fetches posts with optional filters
   * - tag: Filter by tag
   * - search: Search query
   * - Returns: { data, isLoading, error }
   * - Default to empty array if data is undefined
   * - isLoading: true only on initial load (shows skeleton)
   * - Background refetches happen seamlessly without showing skeleton
   *
   * useSavedPosts: Fetches user's saved posts
   * - Only called if user is authenticated (optimization)
   * - Used to show saved status on each post card
   */
  const { data: posts = [], isLoading } = usePosts({
    tag: selectedTag || undefined,
    search: searchQuery || undefined,
  });
  // Only fetch saved posts if user is authenticated (optimization)
  const { data: savedPosts = [] } = useSavedPosts({
    enabled: isAuthenticated, // Only fetch if user is logged in
  });
  // Create array of saved post IDs for quick lookup
  const savedPostIds = savedPosts.map((p) => p.id);

  // Track if any post is being updated (for skeleton loading)
  // We check if there's a mutation in progress for posts
  const isUpdatingPost = useIsMutating({
    mutationKey: ["updatePost"],
    exact: false,
  }) > 0;

  /**
   * Sync selectedTag with URL parameter
   *
   * When URL changes (e.g., /posts?tag=react),
   * update local state to match
   */
  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    setSelectedTag(tagFromUrl);
    
    // Reset to page 1 when tag or search changes
    const pageFromUrl = searchParams.get("page");
    if ((tagFromUrl || searchQuery) && pageFromUrl && parseInt(pageFromUrl, 10) > 1) {
      const params = new URLSearchParams(searchParams);
      params.delete("page");
      router.replace(`/posts${params.toString() ? "?" + params.toString() : ""}`);
    }
  }, [searchParams, searchQuery, router]);

  /**
   * Filter posts by tag or search query (client-side filtering as fallback)
   *
   * Why client-side filtering?
   * - Server already filters, but this provides additional filtering
   * - Can combine multiple filters
   * - Instant filtering (no API call)
   *
   * Note: Server-side filtering is preferred for large datasets
   */
  const filteredPosts = posts.filter((post) => {
    if (selectedTag) {
      // Filter by tag
      return post.tags.includes(selectedTag);
    }
    if (searchQuery) {
      // Search in title, description, content, and tags
      return (
        post.title.toLowerCase().includes(searchQuery) ||
        post.description.toLowerCase().includes(searchQuery) ||
        post.content.toLowerCase().includes(searchQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
      );
    }
    return true; // No filter, show all posts
  });

  // Pagination calculations
  const totalPosts = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalPosts / postsPerPage));
  // Ensure currentPage is within valid range
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
  
  // Redirect to valid page if current page is out of bounds
  useEffect(() => {
    if (currentPage !== validPage && totalPages > 0) {
      const params = new URLSearchParams(searchParams);
      if (validPage === 1) {
        params.delete("page");
      } else {
        params.set("page", validPage.toString());
      }
      router.replace(`/posts${params.toString() ? "?" + params.toString() : ""}`);
    }
  }, [currentPage, validPage, totalPages, searchParams, router]);
  
  // Navigation handlers
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", newPage.toString());
    }
    router.push(`/posts${params.toString() ? "?" + params.toString() : ""}`);
    // Scroll to top of posts section
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Recent posts (last 5)
  const recentPosts = [...posts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)
    .map((post) => ({ id: post.id, title: post.title }));

  // Popular topics (top 5 tags by likes + helpfulCount)
  const tagStats: Record<string, number> = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagStats[tag] = (tagStats[tag] || 0) + post.likes + post.helpfulCount;
    });
  });
  const popularTopics = Object.entries(tagStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return (
    <div className="flex pt-32 max-w-9xl mx-auto px-2 sm:px-4 xl:px-8 pb-8 flex-col md:flex-row">
      <main className="w-3/4 px-8">
        {/* Active filter chips */}
        <div className="mb-4 flex gap-2">
          {selectedTag && (
            <Badge
              variant="secondary"
              className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm border-0"
            >
              Tag: {selectedTag}
              <button
                className="ml-2 text-blue-500 hover:text-blue-700"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete("tag");
                  router.push(
                    `/posts${params.toString() ? "?" + params.toString() : ""}`
                  );
                }}
              >
                ×
              </button>
            </Badge>
          )}
          {searchQuery && (
            <Badge
              variant="secondary"
              className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm border-0"
            >
              Search: {searchQuery}
              <button
                className="ml-2 text-green-500 hover:text-green-700"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete("search");
                  router.push(
                    `/posts${params.toString() ? "?" + params.toString() : ""}`
                  );
                }}
              >
                ×
              </button>
            </Badge>
          )}
        </div>

        {/* Matched tags for search */}
        {searchQuery && filteredPosts.length > 0 && (
          <div className="mb-2">
            <span className="font-semibold">Matched Tags: </span>
            {[
              ...new Set(
                filteredPosts.flatMap((post) =>
                  post.tags.filter((tag) =>
                    tag.toLowerCase().includes(searchQuery)
                  )
                )
              ),
            ].map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-sm mr-2 border-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <h1 className="text-2xl font-bold mb-4">
          {selectedTag ? `Posts tagged "${selectedTag}"` : "Posts"}
          {!isLoading && <span className="text-gray-600 font-normal text-lg"> ({totalPosts})</span>}
        </h1>

        {/* Loading state with skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 w-full">
            {[1, 2, 3].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex items-center justify-center h-[40vh]">
            <span className="text-gray-500 text-2xl">
              {searchQuery || selectedTag
                ? "No posts found matching your criteria."
                : "There is no post posted yet."}
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 w-full">
              {paginatedPosts.map((post) => {
                // Show skeleton briefly during update to prevent flash of old data
                // Optimistic updates should handle most of the UI update, but this prevents
                // the brief moment where old cached data might flash before new data arrives
                const showSkeleton = isUpdatingPost;
                
                return showSkeleton ? (
                  <PostCardSkeleton key={post.id} />
                ) : (
                  <PostCard
                    key={post.id}
                    post={{
                      ...post,
                      onClick: () => router.push(`/post/${post.id}`),
                      liked: !!post.liked,
                      helpful: !!post.helpful,
                      likes: post.likes || 0,
                      helpfulCount: post.helpfulCount || 0,
                    }}
                    saved={savedPostIds.includes(post.id)}
                    currentUser={currentUser || null}
                    onUnsave={(_postId) => {
                      // React Query will handle cache update automatically
                    }}
                    onDelete={(_postId) => {
                      // React Query will handle cache update automatically
                    }}
                    onLikeHelpfulUpdate={(_postId, _data) => {
                      // React Query optimistic updates handle this
                    }}
                  />
                );
              })}
            </div>
            {/* Pagination buttons - Always show when there are posts */}
            {totalPosts > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  onClick={() => handlePageChange(validPage - 1)}
                  disabled={validPage === 1}
                  className="bg-blue-500 font-courier text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-600 font-courier text-sm sm:text-base">
                  Page {validPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(validPage + 1)}
                  disabled={validPage === totalPages}
                  className="bg-blue-500 font-courier text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Sidebar
        onTagSelect={setSelectedTag}
        recentPosts={recentPosts}
        popularTopics={popularTopics}
        isLoading={isLoading}
      />
    </div>
  );
}

/**
 * Default export - Wraps PostsContent in Suspense boundary
 * Required by Next.js when using useSearchParams() for static generation
 */
export default function PostsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex pt-32">
          <main className="w-3/4 px-8">
            <div className="grid grid-cols-1 gap-4 w-full">
              {[1, 2, 3].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          </main>
          <Sidebar
            onTagSelect={() => {}}
            recentPosts={[]}
            popularTopics={[]}
            isLoading={true}
          />
        </div>
      }
    >
      <PostsContent />
    </Suspense>
  );
}
