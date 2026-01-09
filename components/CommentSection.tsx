/**
 * CommentSection Component - Refactored with React Query
 * Features: Optimistic updates, automatic cache invalidation, skeleton loading
 * Uses centralized hooks for all data operations
 */

"use client";

import React, { useState } from "react";
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useLikeComment,
  useHelpfulComment,
} from "@/hooks/use-comments";
import { useImageUpload } from "@/hooks/use-image-upload";
import { Comment } from "@/types";
import { CommentSkeleton } from "@/components/ui/skeleton";
import CommentItem from "./CommentItem";
import CommentInput from "./CommentInput";
import CommentAvatar from "./CommentAvatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface CommentSectionProps {
  postId: string;
  parentId?: string;
  onShowLoginPrompt?: () => void;
}

/**
 * CommentSection Component
 *
 * Features:
 * - Nested comment threads (replies to comments)
 * - Image uploads in comments
 * - Real-time optimistic updates
 * - Edit/Delete own comments
 * - Like comments
 *
 * Nested Structure:
 * - parentId === undefined: Top-level comments
 * - parentId === "comment-id": Replies to that comment
 * - Component can be used recursively for nested replies
 */
const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  parentId, // If provided, shows only replies to this comment
  onShowLoginPrompt, // Callback to show login prompt dialog
}) => {
  // Form state for new comment
  const [newComment, setNewComment] = useState(""); // Comment text
  const [image, setImage] = useState<File | null>(null); // Image file to upload
  const [replyTo, setReplyTo] = useState<string | null>(null); // Comment ID being replied to

  // Edit state
  const [editingComment, setEditingComment] = useState<string | null>(null); // Comment ID being edited
  const [editText, setEditText] = useState(""); // Edited comment text

  // UI state
  const [imagePreview, setImagePreview] = useState<string | null>(null); // Preview URL for image before upload
  const [showShareModal, setShowShareModal] = useState<string | null>(null); // Share modal for comment link
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null); // Comment ID to delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Show delete confirmation dialog

  // React Query hooks with automatic caching and optimistic updates
  // useComments: Fetches all comments for this post
  // Default to empty array if data is undefined (prevents errors)
  const { data: allComments = [], isLoading } = useComments(postId);
  const createCommentMutation = useCreateComment(); // Create new comment
  const updateCommentMutation = useUpdateComment(); // Edit existing comment
  const deleteCommentMutation = useDeleteComment(); // Delete comment
  const likeCommentMutation = useLikeComment(); // Like/unlike comment (optimistic update)
  const helpfulCommentMutation = useHelpfulComment(); // Helpful/unhelpful comment (optimistic update)
  const { uploadImage, uploading: _uploading } = useImageUpload(); // Upload images

  /**
   * Filter comments by parentId for nested structure
   *
   * If parentId is provided:
   * - Show only comments that are replies to that parent
   *
   * If parentId is not provided:
   * - Show only top-level comments (no parentId)
   *
   * This allows recursive nesting of comment threads
   */
  const comments = allComments.filter((c: Comment) =>
    parentId ? c.parentId === parentId : !c.parentId
  );

  // Check if user is logged in
  const user =
    typeof window !== "undefined" && localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")!)
      : null;
  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem("token");

  /**
   * Handle adding a new comment with optimistic update
   *
   * Flow:
   * 1. Validate: Must have text or image
   * 2. Upload image if present (to ImageKit)
   * 3. Create comment with text + image URL
   * 4. React Query handles optimistic update automatically
   * 5. Reset form on success
   *
   * @param replyParentId - Optional: ID of comment being replied to (for nested replies)
   */
  const handleAddComment = async (replyParentId?: string) => {
    // Validation: Must have either text or image
    if (!newComment.trim() && !image) return;

    // Upload image to ImageKit if present
    // Images are uploaded first, then comment is created with image URL
    let uploadedImageUrl: string | undefined;
    if (image) {
      const result = await uploadImage(image, "comments");
      if (result) {
        uploadedImageUrl = result.url; // Use uploaded image URL
      }
    }

    // Prepare comment data
    const commentData = {
      postId, // Which post this comment belongs to
      content: newComment, // Comment text
      parentId: replyParentId || undefined, // If replying, set parentId
      imageUrl: uploadedImageUrl, // Optional image URL
    };

    // Trigger mutation - React Query handles optimistic update
    createCommentMutation.mutate(commentData, {
      onSuccess: () => {
        // Reset form after successful comment creation
        setNewComment("");
        setImage(null);
        setImagePreview(null);
        setReplyTo(null);
      },
    });
  };

  /**
   * Handle image selection with preview
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  /**
   * Initialize comment editing
   */
  const handleEditComment = async (commentId: string) => {
    setEditingComment(commentId);
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      setEditText(comment.content);
    }
  };

  /**
   * Delete comment with confirmation dialog
   */
  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  /**
   * Confirm comment deletion
   */
  const confirmDeleteComment = () => {
    if (commentToDelete) {
      deleteCommentMutation.mutate({ id: commentToDelete, postId });
      setCommentToDelete(null);
    }
  };

  /**
   * Save edited comment
   */
  const handleSaveEdit = async (commentId: string) => {
    updateCommentMutation.mutate(
      { id: commentId, content: editText, postId },
      {
        onSuccess: () => {
          setEditingComment(null);
          setEditText("");
        },
      }
    );
  };

  /**
   * Toggle comment like with optimistic update
   */
  const handleLikeComment = async (commentId: string) => {
    if (!isLoggedIn) {
      onShowLoginPrompt?.();
      return;
    }
    likeCommentMutation.mutate({ commentId, postId });
  };

  /**
   * Toggle comment helpful status with optimistic update
   */
  const handleHelpfulComment = async (commentId: string) => {
    if (!isLoggedIn) {
      onShowLoginPrompt?.();
      return;
    }
    helpfulCommentMutation.mutate({ commentId, postId });
  };

  /**
   * Share comment via native share API or clipboard
   */
  const handleShare = async (commentId: string) => {
    const commentToShare = allComments.find((c: Comment) => c.id === commentId);
    if (!commentToShare) return;

    const shareUrl = `${window.location.origin}/post/${postId}?comment=${commentId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Shared Comment",
          text: commentToShare.content,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        setShowShareModal(commentId);
        setTimeout(() => setShowShareModal(null), 2000);
      }
    } catch (error) {
      // Ignore AbortError (user cancelled share)
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing comment:", error);
      }
    }
  };

  // Show skeleton loading during initial fetch
  if (isLoading && !allComments.length) {
    return (
      <div className="space-y-4">
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            user={user}
            onEdit={() => handleEditComment(comment.id)}
            onDelete={() => handleDeleteComment(comment.id)}
            onLike={() => handleLikeComment(comment.id)}
            onHelpful={() => handleHelpfulComment(comment.id)}
            onReply={() => {
              if (!isLoggedIn) {
                onShowLoginPrompt?.();
                return;
              }
              setReplyTo(comment.id);
            }}
            onShare={() => handleShare(comment.id)}
            showShareModal={showShareModal === comment.id}
            isEditing={editingComment === comment.id}
            editText={editText}
            onEditTextChange={(e) => setEditText(e.target.value)}
            onSaveEdit={() => handleSaveEdit(comment.id)}
            onCancelEdit={() => {
              setEditingComment(null);
              setEditText("");
            }}
            isLoggedIn={isLoggedIn}
            replyTo={replyTo}
            newComment={newComment}
            onReplyInputChange={(e) => setNewComment(e.target.value)}
            onReplySubmit={() => handleAddComment(comment.id)}
            onReplyCancel={() => {
              setReplyTo(null);
              setNewComment("");
              setImage(null);
              setImagePreview(null);
            }}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            onRemoveImage={() => {
              setImage(null);
              setImagePreview(null);
            }}
          >
            {/* Nested comments - recursive rendering */}
            <div className="ml-8 mt-4">
              <CommentSection
                postId={postId}
                parentId={comment.id}
                onShowLoginPrompt={onShowLoginPrompt}
              />
            </div>
          </CommentItem>
        ))}
      </ul>

      {/* Main comment input - only show at top level */}
      {isLoggedIn && !parentId && !replyTo && (
        <div className="flex gap-3 items-start bg-white rounded-lg shadow p-4">
          <CommentAvatar author={user} />
          <div className="flex-1">
            <CommentInput
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onImageChange={handleImageChange}
              imagePreview={imagePreview}
              onRemoveImage={() => {
                setImage(null);
                setImagePreview(null);
              }}
              onSubmit={() => handleAddComment()}
              onCancel={() => {
                setNewComment("");
                setImage(null);
                setImagePreview(null);
              }}
            />
          </div>
        </div>
      )}

      {!isLoggedIn && !parentId && (
        <div className="text-center p-4 bg-white rounded-lg shadow">
          <p className="text-gray-600">
            Please{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              log in
            </a>{" "}
            to comment.
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteComment}
        variant="destructive"
      />
    </div>
  );
};

export default CommentSection;
