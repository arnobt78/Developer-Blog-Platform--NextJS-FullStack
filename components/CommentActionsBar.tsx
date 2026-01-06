"use client";

import React from "react";

interface CommentActionsBarProps {
  liked: boolean;
  helpful: boolean;
  likeCount: number;
  helpfulCount: number;
  onLike: () => void;
  onHelpful: () => void;
  onReply: () => void;
  onShare: () => void;
  showShareModal: boolean;
}

const CommentActionsBar: React.FC<CommentActionsBarProps> = ({
  liked,
  helpful,
  likeCount,
  helpfulCount,
  onLike,
  onHelpful,
  onReply,
  onShare,
  showShareModal,
}) => (
  <div className="flex gap-4 mt-2 text-sm">
    <button
      onClick={onLike}
      className={`flex items-center gap-1 transition-colors ${
        liked
          ? "text-blue-600 font-semibold"
          : "text-gray-600 hover:text-blue-600"
      }`}
      type="button"
      aria-pressed={liked}
    >
      <span className="w-4 h-4">{liked ? "👍" : "👍🏻"}</span>
      {likeCount > 0 && likeCount} Like
    </button>
    <button
      onClick={onHelpful}
      className={`flex items-center gap-1 transition-colors ${
        helpful
          ? "text-pink-600 font-semibold"
          : "text-gray-600 hover:text-pink-600"
      }`}
      type="button"
      aria-pressed={helpful}
    >
      <span className="w-4 h-4">{helpful ? "❤️" : "🤍"}</span>
      {helpfulCount > 0 && helpfulCount} Helpful
    </button>
    <button
      onClick={onReply}
      className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
    >
      <span className="w-4 h-4">💬</span>
      Reply
    </button>
    <button
      onClick={onShare}
      className="flex items-center gap-1 text-gray-600 hover:text-purple-600 transition-colors"
    >
      <span className="w-4 h-4">🔗</span>
      Share
    </button>
    {showShareModal && (
      <span className="text-green-600 animate-fade-in">Link copied!</span>
    )}
  </div>
);

export default CommentActionsBar;
