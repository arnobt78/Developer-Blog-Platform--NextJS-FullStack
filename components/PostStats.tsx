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
    <div className="flex items-center space-x-2">
      {(likeCount > 0 || helpfulCount > 0) && (
        <>
          <div className="flex items-center gap-1">
            {liked && <span className="text-blue-600">👍</span>}
            <span>{likeCount} likes</span>
          </div>
          <div className="flex items-center gap-1">
            {helpful && <span className="text-pink-600">❤️</span>}
            <span>{helpfulCount} helpful</span>
          </div>
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
