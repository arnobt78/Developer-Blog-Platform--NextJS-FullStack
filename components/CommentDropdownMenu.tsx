"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BsThreeDots } from "react-icons/bs";

/**
 * CommentDropdownMenu Component (ShadCN-based)
 *
 * Reusable dropdown menu for comment actions:
 * - Edit comment (owner only)
 * - Delete comment (owner only)
 *
 * Features:
 * - Built with ShadCN UI DropdownMenu (Radix UI primitives)
 * - Automatic click-outside handling
 * - Keyboard navigation support
 * - Accessible ARIA attributes
 * - Consistent styling across the app
 */
interface CommentDropdownMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const CommentDropdownMenu: React.FC<CommentDropdownMenuProps> = ({
  onEdit,
  onDelete,
}) => (
  <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <button className="p-1 hover:bg-gray-100 rounded-full">
        <BsThreeDots />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      className="min-w-[120px] bg-white border border-gray-200 shadow-lg"
    >
      <DropdownMenuItem
        onClick={onEdit}
        className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
      >
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={onDelete}
        className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 text-red-600 focus:text-red-600"
      >
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default CommentDropdownMenu;
