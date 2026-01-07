"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface PostContentProps {
  title: string;
  description: string;
  content?: string;
  imageUrl?: string;
  codeSnippet?: string;
  tags: string[];
  onClick?: () => void;
}

const PostContent: React.FC<PostContentProps> = ({
  title,
  description,
  content,
  imageUrl,
  codeSnippet,
  tags,
  onClick,
}) => (
  <div className="mt-8">
    <h2
      className={`font-courier text-md font-bold my-4 ${
        onClick ? "hover:text-blue-600 cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      {title}
    </h2>
    <p className="text-gray-700 text-sm font-courier text-pretty text-justify mb-12">
      {description}
    </p>
    {imageUrl && (
      <div className="relative w-full aspect-video mb-12">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          className="object-contain rounded-lg"
        />
      </div>
    )}
    {content && (
      <div className="mb-12">
        <h3 className="font-courier text-md font-bold mb-2">Solution:</h3>
        <p className="text-gray-700 text-sm font-courier text-pretty text-justify">
          {content}
        </p>
      </div>
    )}
    {codeSnippet && (
      <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto mb-12">
        <code>{codeSnippet}</code>
      </pre>
    )}
    <div className="flex flex-wrap gap-2 mb-12">
      {tags?.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="bg-blue-100 text-blue-500 text-sm font-courier px-3 py-1 rounded-full hover:bg-blue-200 cursor-pointer border-0"
        >
          #{tag}
        </Badge>
      ))}
    </div>
  </div>
);

export default PostContent;
