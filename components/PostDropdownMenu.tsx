"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BsThreeDots } from "react-icons/bs";

/**
 * PostDropdownMenu Component (ShadCN-based)
 *
 * Reusable dropdown menu for post actions:
 * - Save/Unsave post
 * - Edit post (owner only)
 * - Delete post (owner only)
 * - Report post
 *
 * Features:
 * - Built with ShadCN UI DropdownMenu (Radix UI primitives)
 * - Automatic click-outside handling
 * - Keyboard navigation support
 * - Accessible ARIA attributes
 * - Consistent styling across the app
 */
interface PostDropdownMenuProps {
  isAuthor: boolean;
  saved: boolean;
  reported: boolean;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}

const PostDropdownMenu: React.FC<PostDropdownMenuProps> = ({
  isAuthor,
  saved,
  reported,
  onSave,
  onEdit,
  onDelete,
  onReport,
}) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <BsThreeDots className="w-5 h-5 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-white border border-gray-200 shadow-lg"
      >
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="font-courier cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
        >
          {saved ? "Unsave Post" : "Save Post"}
        </DropdownMenuItem>
        {isAuthor && (
          <>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="font-courier cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
            >
              Edit Post
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="font-courier cursor-pointer hover:bg-gray-100 focus:bg-gray-100 text-red-600 focus:text-red-600"
            >
              Delete Post
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onReport();
          }}
          disabled={reported}
          className="font-courier cursor-pointer hover:bg-gray-100 focus:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reported ? "Reported" : "Report Post"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PostDropdownMenu;
