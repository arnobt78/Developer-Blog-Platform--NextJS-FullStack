"use client";

import React from "react";
import Image from "next/image";

interface PostContentProps {
  title: string;
  description: string;
  imageUrl?: string;
  codeSnippet?: string;
  tags: string[];
  onClick?: () => void;
}

const PostContent: React.FC<PostContentProps> = ({
  title,
  description,
  imageUrl,
  codeSnippet,
  tags,
  onClick,
}) => (
  <div className="mt-8">
    <h2
      className={`font-courier text-2xl font-bold my-4 ${
        onClick ? "hover:text-blue-600 cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      {title}
    </h2>
    <p className="text-gray-700 text-xl font-courier text-pretty text-justify mb-12">
      {description}
    </p>
    {imageUrl && (
      <div className="relative aspect-video mb-12">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          className="object-cover rounded-lg"
        />
      </div>
    )}
    {codeSnippet && (
      <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto mb-12">
        <code>{codeSnippet}</code>
      </pre>
    )}
    <div className="flex flex-wrap gap-2 mb-12">
      {tags?.map((tag) => (
        <span
          key={tag}
          className="bg-blue-100 text-blue-500 text-xl font-courier text-pretty text-justify px-3 py-1 rounded-full text-md hover:bg-blue-200 cursor-pointer"
        >
          #{tag}
        </span>
      ))}
    </div>
  </div>
);

export default PostContent;
