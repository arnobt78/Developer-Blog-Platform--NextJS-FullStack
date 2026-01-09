"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TagSelector from "./TagSelector";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  onTagSelect?: (tag: string) => void;
  recentPosts?: { id: string; title: string }[];
  popularTopics?: string[];
  isLoading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onTagSelect,
  recentPosts = [],
  popularTopics = [],
  isLoading = false,
}) => {
  const router = useRouter();

  // When a tag is clicked, navigate to /posts?tag=TAGNAME
  const handleTagClick = (tag: string) => {
    if (onTagSelect) {
      onTagSelect(tag);
    }
    router.push(`/posts?tag=${encodeURIComponent(tag)}`);
  };

  return (
    <aside className="w-1/4 p-4 bg-gray-100 sticky top-32 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
      <TooltipProvider>
        <div className="mb-6">
          <h2 className="text-lg font-bold">Tags</h2>
          <TagSelector onSelectTag={handleTagClick} />
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-bold">Recent Posts</h2>
          <ul>
            {isLoading ? (
              // Show 5 skeleton lines matching text-sm height during loading
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <li className="py-2" key={i}>
                    <Skeleton className="h-5 w-full bg-gray-300" />
                  </li>
                ))}
              </>
            ) : (
              recentPosts.map((post) => (
                <li className="py-2" key={post.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/post/${post.id}`}
                        className="text-blue-600 hover:underline line-clamp-2 block overflow-hidden text-sm"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {post.title}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{post.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold">Popular Topics</h2>
          <ul>
            {isLoading ? (
              // Show 5 skeleton lines matching text-sm height during loading
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <li className="py-2" key={i}>
                    <Skeleton className="h-5 w-3/4 bg-gray-300" />
                  </li>
                ))}
              </>
            ) : (
              popularTopics.map((topic) => (
                <li className="py-2" key={topic}>
                  <button
                    className="text-blue-600 hover:underline bg-transparent border-none p-0 m-0 text-sm"
                    onClick={() => handleTagClick(topic)}
                  >
                    {topic}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </TooltipProvider>
    </aside>
  );
};

export default Sidebar;
