import React, { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Sidebar from "../components/Sidebar";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Post } from "../types";
import { api } from "../api";

const Posts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams] = useSearchParams();

  // 1. Get search query from URL
  const searchQuery = searchParams.get("search")?.toLowerCase() || null;

  // Fetch posts on initial load and when token changes
  useEffect(() => {
    // Only run fetchPosts if location.pathname changes (not on every location or token change)
    fetchPosts();
    // eslint-disable-next-line
  }, [location.pathname]);

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
          onClick: () => navigate(`/post/${post.id}`),
          liked: !!post.liked,
          helpful: !!post.helpful,
          likes: post.likes || 0,
          helpfulCount: post.helpfulCount || 0,
        }))
      );
    } catch (error) {
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
              // Ensure local state is always in sync for toggles
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

  // 2. Filter posts by tag or search query
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
      try {
        const res = await api.get<Post[]>("/users/me/saved-posts");
        setSavedPostIds(res.data.map((p) => p.id));
      } catch (e) {
        setSavedPostIds([]);
      }
    };
    fetchSavedIds();
  }, [localStorage.getItem("token")]);

  // Unsave post handler
  const handleUnsave = (postId: string) => {
    setSavedPostIds((prev) => prev.filter((id) => id !== postId));
  };

  // Delete post handler
  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // 3. UI for active search/tag filter and matched tags
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
                  searchParams.delete("tag");
                  navigate(
                    `/posts${
                      searchParams.toString()
                        ? "?" + searchParams.toString()
                        : ""
                    }`
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
                  searchParams.delete("search");
                  navigate(
                    `/posts${
                      searchParams.toString()
                        ? "?" + searchParams.toString()
                        : ""
                    }`
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
          <LoadingSpinner text="Loading posts..." />
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
};

export default Posts;
