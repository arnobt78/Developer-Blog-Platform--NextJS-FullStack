"use client";

import React from "react";
import Image from "next/image";
import { Comment } from "@/types";

interface CommentAvatarProps {
  author: Comment["author"];
}

const CommentAvatar: React.FC<CommentAvatarProps> = ({ author }) => (
  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
    <Image
      src={
        author?.avatarUrl
          ? author.avatarUrl
          : `https://robohash.org/${author?.name || "user"}.png?size=80x80`
      }
      alt={author?.name || "User"}
      fill
      className="object-cover"
    />
  </div>
);

export default CommentAvatar;
