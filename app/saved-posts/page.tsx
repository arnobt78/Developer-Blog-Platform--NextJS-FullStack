"use client";

import React from "react";
import { PostCardSkeleton } from "@/components/ui/skeleton";
import PostCard from "@/components/PostCard";
import { useSavedPosts, useUnsavePost } from "@/hooks/use-posts";

export default function SavedPosts() {
  const { data: posts = [], isLoading } = useSavedPosts();
  const unsavePost = useUnsavePost();

  // Remove post from list when unsaved with optimistic update
  const handleUnsave = (postId: string) => {
    unsavePost.mutate(postId);
  };

  return (
    <div className="container mx-auto pt-24 px-4">
      <h1 className="text-2xl font-bold mb-4">Your Saved Posts</h1>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 w-full">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
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
}
