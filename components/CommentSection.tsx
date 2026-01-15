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
import { useSession } from "next-auth/react";
import { useIsMutating } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

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
  console.log("Rendering CommentSection:", { postId, parentId });

  // Form state for new comment
  const [newComment, setNewComment] = useState(""); // Comment text
  const [image, setImage] = useState<File | null>(null); // Image file to upload
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>(undefined); // Uploaded image URL
  const [replyTo, setReplyTo] = useState<string | null>(null); // Comment ID being replied to

  // Edit state
  const [editingComment, setEditingComment] = useState<string | null>(null); // Comment ID being edited
  const [editText, setEditText] = useState(""); // Edited comment text

  // UI state
  const [imagePreview, setImagePreview] = useState<string | null>(null); // Preview URL for image before upload
  const [showShareModal, setShowShareModal] = useState<string | null>(null); // Share modal for comment link
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null); // Comment ID to delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Show delete confirmation dialog
  const [loadingCommentId, setLoadingCommentId] = useState<string | null>(null); // Track loading state for like/helpful actions

  // React Query hooks with automatic caching and optimistic updates
  const { data: allComments = [], isLoading } = useComments(postId);
  const createCommentMutation = useCreateComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const likeCommentMutation = useLikeComment();
  const helpfulCommentMutation = useHelpfulComment();
  const { uploadImage, uploading, progress } = useImageUpload();

  // Track if any comment is being updated (for skeleton loading)
  const isUpdatingComment = useIsMutating({
    mutationKey: ["updateComment"],
    exact: false,
  }) > 0;

  // Authentication hooks
  const { data: session, status } = useSession();
  const { data: currentUser } = useUser(session?.user?.id);
  const user = currentUser || session?.user || null;
  const isLoadingAuth = status === "loading";
  const isLoggedIn = !!user && !isLoadingAuth;

  // Filter comments by parentId for nested structure
  const comments = allComments.filter((c: Comment) =>
    parentId ? c.parentId === parentId : !c.parentId
  );
  console.log("Filtered comments:", comments);

  /**
   * Handle adding a new comment with optimistic update
   *
   * Flow:
   * 1. Validate: Must have text or uploaded image
   * 2. Use already uploaded image URL (upload happens on image selection)
   * 3. Create comment with text + image URL
   * 4. React Query handles optimistic update automatically
   * 5. Reset form on success
   *
   * @param replyParentId - Optional: ID of comment being replied to (for nested replies)
   */
  const handleAddComment = async (replyParentId?: string) => {
    // Validation: Must have either text or uploaded image
    if (!newComment.trim() && !uploadedImageUrl) return;

    // Prepare comment data
    const commentData = {
      postId, // Which post this comment belongs to
      content: newComment, // Comment text
      parentId: replyParentId || undefined, // If replying, set parentId
      imageUrl: uploadedImageUrl, // Optional image URL (already uploaded)
    };

    // Trigger mutation - React Query handles optimistic update
    createCommentMutation.mutate(commentData, {
      onSuccess: () => {
        // Reset form after successful comment creation
        setNewComment("");
        setImage(null);
        setImagePreview(null);
        setUploadedImageUrl(undefined);
        setReplyTo(null);
      },
    });
  };

  /**
   * Handle image selection with preview and immediate upload
   * Uploads image immediately when selected for better UX
   */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      
      // Upload image immediately when selected
      const result = await uploadImage(file, "comments");
      if (result) {
        setUploadedImageUrl(result.url);
      } else {
        // If upload failed, clear the image
        setImage(null);
        setImagePreview(null);
      }
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
    console.log(`Toggling like for comment: ${commentId}`);
    likeCommentMutation.mutate(
      { commentId, postId },
      {
        onSuccess: () => {
          console.log(`Successfully toggled like for comment: ${commentId}`);
        },
        onError: (error) => {
          console.error(`Error toggling like for comment: ${commentId}`, error);
        },
      }
    );
  };

  /**
   * Toggle comment helpful status with optimistic update
   */
  const handleHelpfulComment = async (commentId: string) => {
    if (!isLoggedIn) {
      onShowLoginPrompt?.();
      return;
    }
    console.log(`Toggling helpful for comment: ${commentId}`);
    helpfulCommentMutation.mutate(
      { commentId, postId },
      {
        onSuccess: () => {
          console.log(`Successfully toggled helpful for comment: ${commentId}`);
        },
        onError: (error) => {
          console.error(
            `Error toggling helpful for comment: ${commentId}`,
            error
          );
        },
      }
    );
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

  // Ensure that the CommentSection component re-renders when the cache updates
  // Add a key prop to force re-rendering when the postId or parentId changes
  return (
    <div key={`${postId}-${parentId}-${comments.length}`} className="space-y-4">
      <ul className="space-y-4">
        {comments.map((comment) => {
          // Show skeleton during update to prevent flash of old data
          const showSkeleton = isUpdatingComment && editingComment === comment.id;
          
          return showSkeleton ? (
            <CommentSkeleton key={comment.id} />
          ) : (
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
            isSaving={updateCommentMutation.isPending && editingComment === comment.id}
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
              setUploadedImageUrl(undefined);
            }}
            isReplying={createCommentMutation.isPending && replyTo === comment.id}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            onRemoveImage={() => {
              setImage(null);
              setImagePreview(null);
              setUploadedImageUrl(undefined);
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
          );
        })}
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
                setUploadedImageUrl(undefined);
              }}
              onSubmit={() => handleAddComment()}
              onCancel={() => {
                setNewComment("");
                setImage(null);
                setImagePreview(null);
                setUploadedImageUrl(undefined);
              }}
              uploading={uploading}
              uploadProgress={progress}
              isSubmitting={createCommentMutation.isPending}
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
