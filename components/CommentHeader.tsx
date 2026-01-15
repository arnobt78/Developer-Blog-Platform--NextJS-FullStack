"use client";

import React from "react";

interface CommentHeaderProps {
  author: { name?: string };
  createdAt: Date | string;
}

const CommentHeader: React.FC<CommentHeaderProps> = ({ author, createdAt }) => (
  <div className="flex flex-col">
    <span className="font-semibold">{author?.name || "User"}</span>
    <span className="text-xs text-gray-500">
      {new Date(createdAt).toLocaleString()}
    </span>
  </div>
);

export default CommentHeader;
