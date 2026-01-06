"use client";

import React, { useState, useEffect } from "react";
import { Post } from "@/types";
import { BsThreeDots } from "react-icons/bs";

import CommentSection from "./CommentSection";
import { useRouter } from "next/navigation";
import PostHeader from "./PostHeader";
import PostDropdownMenu from "./PostDropdownMenu";
import PostContent from "./PostContent";
import PostStats from "./PostStats";
import PostActionsBar from "./PostActionsBar";
import PostLoginPrompt from "./PostLoginPrompt";
import {
  useLikePost,
  useMarkHelpful,
  useSavePost,
  useUnsavePost,
  useDeletePost,
} from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InputDialog } from "@/components/InputDialog";

interface PostCardProps {
  post: Post & { onClick?: () => void };
  saved?: boolean;
  onUnsave?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onLikeHelpfulUpdate?: (postId: string, data: Partial<Post>) => void;
}

/**
 * PostCard Component
 * 
 * Displays a single post card with:
 * - Post content (title, description, image, code snippet)
 * - Author information
 * - Like/Helpful buttons with optimistic updates
 * - Save/Unsave functionality
 * - Delete/Edit actions (for post owner)
 * - Comments section
 * - Share functionality
 * 
 * React Query Integration:
 * - Uses mutation hooks for all actions (like, helpful, save, delete)
 * - Optimistic updates provide instant UI feedback
 * - Cache invalidation ensures data stays in sync
 * - No manual state management needed for server data
 */
const PostCard: React.FC<PostCardProps> = ({
  post,
  saved: savedProp = false,
  onUnsave,
  onDelete,
  onLikeHelpfulUpdate,
}) => {
  // Destructure post data
  const {
    id,
    title,
    description,
    createdAt,
    likes: _likes, // Prefixed with _ to indicate unused (we use post.likes directly)
    helpfulCount: _helpfulCount, // Same as above
    comments,
    imageUrl,
    author,
    tags,
    onClick,
    codeSnippet,
  } = post;

  // Local UI state (not synced with server)
  const [showComments, setShowComments] = useState(false); // Toggle comments visibility
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // Show login modal
  const [showDropdown, setShowDropdown] = useState(false); // Show dropdown menu
  const [saved, setSaved] = useState(savedProp); // Saved state (synced with prop)
  const [reported, setReported] = useState(false); // Track if post was reported
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Delete confirmation dialog
  const [showReportDialog, setShowReportDialog] = useState(false); // Report input dialog

  const router = useRouter();

  // React Query hooks for server mutations
  // These handle API calls, caching, and optimistic updates automatically
  const likePost = useLikePost(); // Like/unlike mutation
  const markHelpful = useMarkHelpful(); // Mark helpful mutation
  const savePost = useSavePost(); // Save post mutation
  const unsavePost = useUnsavePost(); // Unsave post mutation
  const deletePost = useDeletePost(); // Delete post mutation
  const { data: authData } = useAuth(); // Get current user authentication state

  // Extract user data from auth query
  const currentUser = authData?.user || null;
  const isLoggedIn = !!currentUser; // Boolean check for login status

  // Use post data directly from props (React Query will handle updates)
  // These values come from the server and are kept in sync via React Query cache
  const liked = !!post.liked; // Convert to boolean
  const helpful = !!post.helpful; // Convert to boolean
  const likeCount = post.likes || 0; // Default to 0 if undefined
  const helpfulCountState = post.helpfulCount || 0; // Default to 0 if undefined

  /**
   * Handle like button click
   * 
   * Flow:
   * 1. Stop event propagation (prevents card click)
   * 2. Check if user is logged in
   * 3. If not logged in, show login prompt
   * 4. If logged in, trigger mutation (optimistic update happens automatically)
   * 5. Notify parent component if callback provided
   * 
   * e.stopPropagation() prevents the card's onClick from firing
   * when clicking buttons inside the card
   */
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (!isLoggedIn) {
      setShowLoginPrompt(true); // Show login modal
      return;
    }
    // Trigger mutation - React Query handles optimistic update
    likePost.mutate(id);
    // Notify parent component if callback provided (for external state sync)
    if (onLikeHelpfulUpdate) {
      onLikeHelpfulUpdate(id, {
        liked: !liked,
        likes: liked ? likeCount - 1 : likeCount + 1,
      });
    }
  };

  const handleHelpful = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    markHelpful.mutate(id);
    // Notify parent if callback provided
    if (onLikeHelpfulUpdate) {
      onLikeHelpfulUpdate(id, {
        helpful: !helpful,
        helpfulCount: helpful ? helpfulCountState - 1 : helpfulCountState + 1,
      });
    }
  };

  /**
   * Handle share functionality
   * 
   * Uses Web Share API if available (mobile devices, modern browsers)
   * Falls back to clipboard copy if Web Share API not supported
   * 
   * Web Share API:
   * - Native share dialog on mobile devices
   * - Can share to any app (WhatsApp, Email, etc.)
   * - Better UX than manual copy-paste
   * 
   * Fallback:
   * - Copy link to clipboard
   * - Show toast notification
   */
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const shareUrl = `${window.location.origin}/post/${id}`;
    const shareData = {
      title: title,
      text: description,
      url: shareUrl,
    };

    try {
      // Check if Web Share API is available (mobile/tablet)
      if (navigator.share) {
        // Use native share dialog
        await navigator.share(shareData);
        toast({
          title: "Success",
          description: "Shared successfully!",
          variant: "success",
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Success",
          description: "Link copied to clipboard!",
          variant: "success",
        });
      }
    } catch (error) {
      // AbortError means user cancelled share - don't show error
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: "Error",
          description: "Failed to share post.",
          variant: "destructive",
        });
      }
    }
  };

  /**
   * Handle card click to navigate to post details
   * 
   * Prevents navigation when clicking on interactive elements (buttons)
   * Uses event delegation to check if click target is a button
   */
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a button or button's child element
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).tagName === "BUTTON"
    ) {
      return; // Exit early, don't navigate
    }
    if (onClick) onClick(); // Navigate to post details page
  };

  /**
   * Sync saved state with prop changes
   * 
   * When savedProp changes (e.g., from parent component),
   * update local state to match
   */
  useEffect(() => {
    setSaved(savedProp);
  }, [savedProp]);

  /**
   * Handle saving/unsaving the post
   * 
   * Toggles between save and unsave based on current state
   * Uses different mutations for save vs unsave
   * 
   * onSuccess callback:
   * - Calls parent's onUnsave callback if provided
   * - Useful for removing post from SavedPosts page immediately
   */
  const handleSave = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (saved) {
      // Post is saved, so unsave it
      unsavePost.mutate(id, {
        onSuccess: () => {
          if (onUnsave) onUnsave(id); // Notify parent (e.g., remove from SavedPosts page)
        },
      });
    } else {
      // Post is not saved, so save it
      savePost.mutate(id);
    }
  };

  const handleEdit = () => {
    router.push(`/edit-post/${id}`);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deletePost.mutate(id, {
      onSuccess: () => {
        if (onDelete) onDelete(id); // Call parent handler
      },
    });
  };

  // Handle reporting the post
  const handleReport = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setShowReportDialog(true);
  };

  const confirmReport = async (reason: string) => {
    try {
      const response = await fetch(`/api/posts/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to report post");
      }
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

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      const dropdown = document.getElementById(`postcard-dropdown-${id}`);
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, id]);

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden"
      onClick={handleCardClick}
    >
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PostHeader author={author} createdAt={createdAt} />
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <BsThreeDots className="w-5 h-5 text-gray-500" />
            </button>
            {showDropdown && isLoggedIn && (
              <PostDropdownMenu
                isAuthor={currentUser?.id === author?.id}
                saved={saved}
                reported={reported}
                onSave={handleSave}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReport={handleReport}
                onClose={() => setShowDropdown(false)}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <PostContent
          title={title}
          description={description}
          imageUrl={imageUrl}
          codeSnippet={codeSnippet}
          tags={tags || []}
          onClick={onClick}
        />

        {/* Stats */}
        <PostStats
          likeCount={likeCount}
          helpfulCount={helpfulCountState}
          commentCount={comments.length}
          liked={liked}
          helpful={helpful}
        />

        {/* Action Buttons */}
        <PostActionsBar
          liked={liked}
          helpful={helpful}
          likeCount={likeCount}
          helpfulCount={helpfulCountState}
          commentCount={comments.length}
          onLike={handleLike}
          onHelpful={handleHelpful}
          onComment={(e) => {
            e.stopPropagation();
            if (!isLoggedIn) {
              setShowLoginPrompt(true);
              return;
            }
            setShowComments(!showComments);
          }}
          onShare={handleShare}
        />

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4">
            <CommentSection postId={id} />
          </div>
        )}
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
};

export default PostCard;
