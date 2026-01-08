"use client";

import React from "react";

interface PostStatsProps {
  likeCount: number;
  helpfulCount: number;
  commentCount: number;
  liked: boolean;
  helpful: boolean;
}

const PostStats: React.FC<PostStatsProps> = ({
  likeCount,
  helpfulCount,
  commentCount,
  liked,
  helpful,
}) => (
  <div className="flex items-center justify-between text-lg font-courier text-pretty text-justify text-gray-500 mb-8">
    <div className="flex items-center space-x-4">
      {(likeCount > 0 || helpfulCount > 0) && (
        <>
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
        </>
      )}
    </div>
    <div className="flex items-center space-x-4">
      {commentCount > 0 && (
        <span>
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </span>
      )}
    </div>
  </div>
);

export default PostStats;
