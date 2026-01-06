"use client";

import React, { useEffect, useState, Suspense } from "react";
import PostCard from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Post } from "@/types";
import { api } from "@/lib/api-client";

function PostsContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Get search query from URL
  const searchQuery = searchParams.get("search")?.toLowerCase() || null;

  // Fetch posts on initial load
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set selected tag from URL if available
  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    setSelectedTag(tagFromUrl);
  }, [searchParams]);

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      const response = await api.get<Post[]>("/posts");
      setPosts(
        response.data.map((post: Post) => ({
          ...post,
          onClick: () => router.push(`/post/${post.id}`),
          liked: !!post.liked,
          helpful: !!post.helpful,
          likes: post.likes || 0,
          helpfulCount: post.helpfulCount || 0,
        }))
      );
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler to update like/helpful state immediately
  const handlePostLikeHelpful = (postId: string, data: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              ...data,
              liked: data.liked !== undefined ? data.liked : p.liked,
              helpful: data.helpful !== undefined ? data.helpful : p.helpful,
              likes: data.likes !== undefined ? data.likes : p.likes,
              helpfulCount:
                data.helpfulCount !== undefined
                  ? data.helpfulCount
                  : p.helpfulCount,
            }
          : p
      )
    );
  };

  // Filter posts by tag or search query
  const filteredPosts = posts.filter((post) => {
    if (selectedTag) {
      return post.tags.includes(selectedTag);
    }
    if (searchQuery) {
      return (
        post.title.toLowerCase().includes(searchQuery) ||
        post.description.toLowerCase().includes(searchQuery) ||
        post.content.toLowerCase().includes(searchQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
      );
    }
    return true;
  });

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

  // Fetch saved post IDs for the current user
  useEffect(() => {
    const fetchSavedIds = async () => {
      if (typeof window !== "undefined" && localStorage.getItem("token")) {
        try {
          const res = await api.get<Post[]>("/users/me/saved-posts");
          setSavedPostIds(res.data.map((p) => p.id));
        } catch {
          setSavedPostIds([]);
        }
      }
    };
    fetchSavedIds();
  }, []);

  // Unsave post handler
  const handleUnsave = (postId: string) => {
    setSavedPostIds((prev) => prev.filter((id) => id !== postId));
  };

  // Delete post handler
  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="flex pt-24">
      <main className="w-3/4 p-8">
        {/* Active filter chips */}
        <div className="mb-4 flex gap-2">
          {selectedTag && (
            <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
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
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
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
            </span>
          )}
        </div>
        {/* Matched tags for search */}
        {searchQuery && (
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
              <span
                key={tag}
                className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs mr-2"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-2xl font-bold mb-4">
          {selectedTag ? `Posts tagged "${selectedTag}"` : "Posts"}
        </h1>

        {/* Loading state or posts */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 w-full">
            {[1, 2, 3].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex items-center justify-center h-[40vh]">
            <span className="text-gray-500 text-2xl">
              There is no post posted yet.
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 w-full">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  saved={savedPostIds.includes(post.id)}
                  onUnsave={handleUnsave}
                  onDelete={handleDelete}
                  onLikeHelpfulUpdate={handlePostLikeHelpful}
                />
              ))}
            </div>
            {/* Pagination buttons */}
            <div className="mt-8 flex justify-between">
              <button className="bg-blue-500 font-courier text-white px-4 py-2 rounded hover:bg-blue-600">
                Previous
              </button>
              <button className="bg-blue-500 font-courier text-white px-4 py-2 rounded hover:bg-blue-600">
                Next
              </button>
            </div>
          </>
        )}
      </main>
      <Sidebar
        onTagSelect={setSelectedTag}
        recentPosts={recentPosts}
        popularTopics={popularTopics}
      />
    </div>
  );
}

export default function Posts() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto pt-24 px-4 pb-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      }
    >
      <PostsContent />
    </Suspense>
  );
}
