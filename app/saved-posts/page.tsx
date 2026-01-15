"use client";

import React from "react";
import { PostCardSkeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { useUser } from "@/hooks/use-auth";
import PostCard from "@/components/PostCard";
import { useSavedPosts, useUnsavePost } from "@/hooks/use-posts";

export default function SavedPosts() {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const isLoadingAuth = status === "loading";
  // Always fetch current user with useUser for latest info
  const { data: currentUser } = useUser(session?.user?.id);

  // Only fetch saved posts if user is authenticated
  const { data: posts = [], isLoading } = useSavedPosts({
    enabled: isAuthenticated,
  });
  const unsavePost = useUnsavePost();

  // Remove post from list when unsaved with optimistic update
  const handleUnsave = (postId: string) => {
    unsavePost.mutate(postId);
  };

  return (
    <div className="max-w-9xl mx-auto pt-32 px-2 sm:px-4 xl:px-8 pb-8 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Your Saved Posts</h1>
      {isLoadingAuth || isLoading ? (
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
              currentUser={currentUser || null}
              onUnsave={handleUnsave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
