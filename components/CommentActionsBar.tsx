"use client";

import React from "react";
import { ThumbsUp, Heart, MessageCircle, Share2 } from "lucide-react";

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
      <ThumbsUp className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
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
      <Heart className="w-4 h-4" fill={helpful ? "currentColor" : "none"} />
      {helpfulCount > 0 && helpfulCount} Helpful
    </button>
    <button
      onClick={onReply}
      className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
    >
      <MessageCircle className="w-4 h-4" />
      Reply
    </button>
    <button
      onClick={onShare}
      className="flex items-center gap-1 text-gray-600 hover:text-purple-600 transition-colors"
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
    {showShareModal && (
      <span className="text-green-600 animate-fade-in">Link copied!</span>
    )}
  </div>
);

export default CommentActionsBar;
