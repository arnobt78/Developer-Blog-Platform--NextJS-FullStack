"use client";

import React from "react";
import Image from "next/image";
import { ThumbsUp, Heart, MessageCircle, Share2 } from "lucide-react";
import CommentAvatar from "./CommentAvatar";
import CommentHeader from "./CommentHeader";
import CommentDropdownMenu from "./CommentDropdownMenu";
import CommentActionsBar from "./CommentActionsBar";
import { Comment, User } from "@/types";

interface CommentItemProps {
  comment: Comment;
  user: User | null;
  onEdit: () => void;
  onDelete: () => void;
  onLike: () => void;
  onHelpful: () => void;
  onReply: () => void;
  onShare: () => void;
  showShareModal: boolean;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isLoggedIn: boolean;
  replyTo: string | null;
  newComment: string;
  onReplyInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onReplySubmit: () => void;
  onReplyCancel: () => void;
  imagePreview?: string | null;
  onImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: () => void;
  children?: React.ReactNode;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  user,
  onEdit,
  onDelete,
  onLike,
  onHelpful,
  onReply,
  onShare,
  showShareModal,
  isEditing,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  isLoggedIn,
  replyTo,
  newComment,
  onReplyInputChange,
  onReplySubmit,
  onReplyCancel,
  imagePreview: _imagePreview,
  onImageChange: _onImageChange,
  onRemoveImage: _onRemoveImage,
  children,
}) => (
  <li className="bg-white rounded-lg shadow p-4">
    <div className="flex gap-3">
      <CommentAvatar author={comment.author} />
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <CommentHeader
            author={comment.author}
            createdAt={comment.createdAt}
          />
          {user && comment.author.id === user.id && (
            <CommentDropdownMenu onEdit={onEdit} onDelete={onDelete} />
          )}
        </div>
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editText}
              onChange={onEditTextChange}
              className="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-4 text-sm">
                {/* Actions remain visible on the left during edit but disabled */}
                <button
                  type="button"
                  className="flex items-center gap-1 text-gray-400 cursor-not-allowed"
                  disabled
                >
                  <ThumbsUp className="w-4 h-4" />
                  Like
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 text-gray-400 cursor-not-allowed"
                  disabled
                >
                  <Heart className="w-4 h-4" />
                  Helpful
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 text-gray-400 cursor-not-allowed"
                  disabled
                >
                  <MessageCircle className="w-4 h-4" />
                  Reply
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 text-gray-400 cursor-not-allowed"
                  disabled
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onSaveEdit}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-gray-800">{comment.content}</p>
            {comment.imageUrl && (
              <div className="mt-2 relative w-80 h-60">
                <Image
                  src={comment.imageUrl}
                  alt="Comment attachment"
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover rounded-lg"
                />
              </div>
            )}
          </>
        )}
        {/* Only show action bar when not editing */}
        {!isEditing && (
          <CommentActionsBar
            liked={!!comment.liked}
            helpful={!!comment.helpful}
            likeCount={comment.likeCount}
            helpfulCount={comment.helpfulCount}
            onLike={onLike}
            onHelpful={onHelpful}
            onReply={onReply}
            onShare={onShare}
            showShareModal={showShareModal}
          />
        )}
        {/* Only show reply input when reply button is clicked */}
        {replyTo === comment.id && isLoggedIn && user && (
          <div className="mt-3">
            <div className="flex gap-2">
              <CommentAvatar author={user} />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={onReplyInputChange}
                  placeholder="Write a reply..."
                  className="w-full px-4 py-2 pr-10 border rounded-full resize-none bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={1}
                />
                {/* Image preview and upload for reply can be added here if needed */}
                <div className="flex gap-2 mt-2 justify-end">
                  {newComment.trim().length > 0 && (
                    <button
                      onClick={onReplyCancel}
                      className="px-4 py-1 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={onReplySubmit}
                    className="px-4 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  </li>
);

export default CommentItem;
