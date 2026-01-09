"use client";

import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";

import CommentSection from "@/components/CommentSection";
import PostDropdownMenu from "@/components/PostDropdownMenu";
import PostActionsBar from "@/components/PostActionsBar";
import PostHeader from "@/components/PostHeader";
import PostStats from "@/components/PostStats";
import PostContent from "@/components/PostContent";
import PostLoginPrompt from "@/components/PostLoginPrompt";

import { BsArrowLeft } from "react-icons/bs";

import {
  usePost,
  useSavedPosts,
  useLikePost,
  useMarkHelpful,
  useSavePost,
  useUnsavePost,
  useDeletePost,
} from "@/hooks/use-posts";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InputDialog } from "@/components/InputDialog";

export default function PostDetails() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [reported, setReported] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // React Query hooks
  const { data: post, isLoading } = usePost(id || "");
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  // Only fetch saved posts if user is authenticated (optimization)
  const { data: savedPosts = [] } = useSavedPosts({
    enabled: isAuthenticated,
  });
  const likePost = useLikePost();
  const markHelpful = useMarkHelpful();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();
  const deletePost = useDeletePost();

  const currentUser = session?.user || null;
  const isLoggedIn = !!currentUser;
  const saved = savedPosts.some((p) => p.id === id);

  // Handle Like
  const handleLike = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!post || !id) return;
    likePost.mutate(id);
  };

  // Handle Helpful
  const handleHelpful = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!post || !id) return;
    markHelpful.mutate(id);
  };

  // Handle Share
  const handleShare = async () => {
    if (!post) return;

    const shareUrl = window.location.href;
    const shareData = {
      title: post.title,
      text: post.description,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Success",
          description: "Shared successfully!",
          variant: "success",
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Success",
          description: "Link copied to clipboard!",
          variant: "success",
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to copy link to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle Save
  const handleSave = () => {
    if (!isLoggedIn || !post || !id) {
      setShowLoginPrompt(true);
      return;
    }
    if (saved) {
      unsavePost.mutate(id);
    } else {
      savePost.mutate(id);
    }
  };

  // Handle Edit
  const handleEdit = () => {
    if (!post) return;
    router.push(`/edit-post/${post.id}`);
  };

  // Handle Delete
  const handleDelete = () => {
    if (!post || !id) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!post || !id) return;
    deletePost.mutate(id, {
      onSuccess: () => {
        router.push("/posts");
      },
    });
  };

  // Handle Report
  const handleReport = () => {
    if (!isLoggedIn || !post || !id) {
      setShowLoginPrompt(true);
      return;
    }
    setShowReportDialog(true);
  };

  const confirmReport = async (reason: string) => {
    if (!post || !id) return;
    try {
      const response = await fetch(`/api/posts/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "" }),
      });
      if (!response.ok) throw new Error("Failed to report post");
      setReported(true);
      toast({
        title: "Success",
        description: "Post reported! Thank you for your feedback.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to report post.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto pt-32 max-w-9xl px-2 sm:px-4 xl:px-8 pb-8 flex flex-col">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <Skeleton className="w-full h-64" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto pt-32 max-w-9xl px-2 sm:px-4 xl:px-8 pb-8 flex flex-col">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Post not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto pt-32 max-w-9xl px-2 sm:px-4 xl:px-8 pb-8 flex flex-col">
      {/* Back Navigation */}
      <button
        onClick={() => router.push("/posts")}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-semibold transition-colors"
      >
        <BsArrowLeft className="w-5 h-5" />
        Back to Posts
      </button>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <PostHeader author={post.author} createdAt={post.createdAt} />
            {isLoggedIn && (
              <PostDropdownMenu
                isAuthor={
                  !!(currentUser && post && currentUser.id === post.author.id)
                }
                saved={saved}
                reported={reported}
                onSave={handleSave}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReport={handleReport}
              />
            )}
          </div>

          {/* Content */}
          <PostContent
            title={post.title}
            description={post.description}
            content={post.content}
            imageUrl={post.imageUrl}
            codeSnippet={post.codeSnippet}
            tags={post.tags || []}
          />

          {/* Stats */}
          <PostStats
            likeCount={post.likes || 0}
            helpfulCount={post.helpfulCount || 0}
            commentCount={post.comments.length}
            liked={!!post.liked}
            helpful={!!post.helpful}
          />

          {/* Action Buttons */}
          <PostActionsBar
            liked={!!post.liked}
            helpful={!!post.helpful}
            likeCount={post.likes || 0}
            helpfulCount={post.helpfulCount || 0}
            commentCount={post.comments.length}
            onLike={handleLike}
            onHelpful={handleHelpful}
            onComment={() => {
              if (!isLoggedIn) {
                setShowLoginPrompt(true);
                return;
              }
              // Optionally scroll to comments
            }}
            onShare={handleShare}
          />

          {/* Comments Section */}
          <div className="mt-6">
            <CommentSection postId={post.id} />
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <PostLoginPrompt onClose={() => setShowLoginPrompt(false)} />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      {/* Report Input Dialog */}
      <InputDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        title="Report Post"
        description="Why are you reporting this post? (optional)"
        placeholder="Enter reason for reporting..."
        confirmText="Report"
        cancelText="Cancel"
        onConfirm={confirmReport}
        type="textarea"
      />
    </div>
  );
}
