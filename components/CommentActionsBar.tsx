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

/**
 * CommentActionsBar Component
 * Displays action buttons for comments with toggle states
 * - Like/Unlike: Shows filled icon when liked
 * - Helpful/Unhelpful: Shows filled icon when marked helpful
 * - Reply: Opens reply input
 * - Share: Copies comment link to clipboard
 *
 * Features:
 * - Optimistic updates via React Query mutations
 * - No counters in buttons (counters shown in stats row above)
 * - Dynamic text: "Like" vs "Unlike", "Helpful" vs "Unhelpful"
 * - Filled icons indicate active state
 */
const CommentActionsBar: React.FC<CommentActionsBarProps> = ({
  liked,
  helpful,
  likeCount: _likeCount, // Not displayed in buttons, shown in stats row
  helpfulCount: _helpfulCount, // Not displayed in buttons, shown in stats row
  onLike,
  onHelpful,
  onReply,
  onShare,
  showShareModal,
}) => (
  <div className="flex gap-4 mt-2 text-sm">
    {/* Like/Unlike Button - Shows filled icon when liked */}
    <button
      onClick={onLike}
      className={`flex items-center gap-1 transition-colors ${
        liked
          ? "text-blue-600 font-semibold"
          : "text-gray-600 hover:text-blue-600"
      }`}
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Unlike comment" : "Like comment"}
    >
      <ThumbsUp className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
      {liked ? "Unlike" : "Like"}
    </button>

    {/* Helpful/Unhelpful Button - Shows filled icon when marked helpful */}
    <button
      onClick={onHelpful}
      className={`flex items-center gap-1 transition-colors ${
        helpful
          ? "text-pink-600 font-semibold"
          : "text-gray-600 hover:text-pink-600"
      }`}
      type="button"
      aria-pressed={helpful}
      aria-label={helpful ? "Mark as not helpful" : "Mark as helpful"}
    >
      <Heart className="w-4 h-4" fill={helpful ? "currentColor" : "none"} />
      {helpful ? "Unhelpful" : "Helpful"}
    </button>

    {/* Reply Button */}
    <button
      onClick={onReply}
      className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
      type="button"
      aria-label="Reply to comment"
    >
      <MessageCircle className="w-4 h-4" />
      Reply
    </button>

    {/* Share Button */}
    <button
      onClick={onShare}
      className="flex items-center gap-1 text-gray-600 hover:text-purple-600 transition-colors"
      type="button"
      aria-label="Share comment"
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>

    {/* Share Success Message */}
    {showShareModal && (
      <span className="text-green-600 animate-fade-in">Link copied!</span>
    )}
  </div>
);

export default CommentActionsBar;
