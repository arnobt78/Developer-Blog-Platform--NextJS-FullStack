import React, { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { Post } from "../types";
import { api } from "../api";
import PostCard from "../components/PostCard";

const SavedPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchSaved = async () => {
      const res = await api.get<Post[]>("/users/me/saved-posts");
      setPosts(res.data);
      setLoading(false);
    };
    fetchSaved();
  }, []);

  // Remove post from list when unsaved
  const handleUnsave = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading) {
    return <LoadingSpinner text="Loading saved posts..." />;
  }
  return (
    <div className="container mx-auto pt-24 px-4">
      <h1 className="text-2xl font-bold mb-4">Your Saved Posts</h1>
      {posts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center w-full">
          <span className="text-gray-500 text-xl">There is no saved post.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 w-full">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              saved={true}
              onUnsave={handleUnsave}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPosts;
