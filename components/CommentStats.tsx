"use client";

import React from "react";

interface CommentStatsProps {
  likeCount: number;
  helpfulCount: number;
  liked: boolean;
  helpful: boolean;
}

/**
 * CommentStats Component
 * Displays like and helpful counts for a comment
 * Similar to PostStats but for individual comments
 *
 * Features:
 * - Shows count only when > 0
 * - Highlights when user has liked/marked helpful
 * - Consistent with PostStats design
 * - Optimistically updates via React Query
 */
const CommentStats: React.FC<CommentStatsProps> = ({
  likeCount,
  helpfulCount,
  liked,
  helpful,
}) => {
  // Don't render if no stats to show
  if (likeCount === 0 && helpfulCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
      {likeCount > 0 && (
        <span className={liked ? "font-semibold text-blue-600" : ""}>
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </span>
      )}
      {helpfulCount > 0 && (
        <span className={helpful ? "font-semibold text-pink-600" : ""}>
          {helpfulCount} {helpfulCount === 1 ? "helpful" : "helpful"}
        </span>
      )}
    </div>
  );
};

export default CommentStats;
