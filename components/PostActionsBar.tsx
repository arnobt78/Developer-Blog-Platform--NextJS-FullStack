"use client";

import React from "react";
import { ThumbsUp, Heart, MessageCircle, Share2 } from "lucide-react";

interface PostActionsBarProps {
  liked: boolean;
  helpful: boolean;
  likeCount: number;
  helpfulCount: number;
  commentCount: number;
  onLike: (e: React.MouseEvent) => void;
  onHelpful: (e: React.MouseEvent) => void;
  onComment: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
}

const PostActionsBar: React.FC<PostActionsBarProps> = ({
  liked,
  helpful,
  likeCount,
  helpfulCount,
  commentCount,
  onLike,
  onHelpful,
  onComment,
  onShare,
}) => (
  <div className="flex items-center justify-between border-t border-b py-2 text-sm font-courier">
    <button
      onClick={onLike}
      className={`flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg transition-colors ${
        liked ? "text-blue-600 font-semibold" : "text-gray-600"
      }`}
      type="button"
    >
      <ThumbsUp className="w-6 h-6" fill={liked ? "currentColor" : "none"} />
      <span>{likeCount > 0 ? likeCount : ""} Like</span>
    </button>
    <button
      onClick={onHelpful}
      className={`flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg transition-colors ${
        helpful ? "text-pink-600 font-semibold" : "text-gray-600"
      }`}
      type="button"
    >
      <Heart className="w-6 h-6" fill={helpful ? "currentColor" : "none"} />
      <span>{helpfulCount > 0 ? helpfulCount : ""} Helpful</span>
    </button>
    <button
      onClick={onComment}
      className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
      type="button"
    >
      <MessageCircle className="w-6 h-6" />
      <span>{commentCount > 0 ? commentCount : ""} Comment</span>
    </button>
    <button
      onClick={onShare}
      className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
      type="button"
    >
      <Share2 className="w-6 h-6" />
      Share
    </button>
  </div>
);

export default PostActionsBar;
