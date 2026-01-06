"use client";

import React from "react";
import { BsThreeDots } from "react-icons/bs";

interface CommentDropdownMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  show: boolean;
  onToggle: () => void;
}

const CommentDropdownMenu: React.FC<CommentDropdownMenuProps> = ({
  onEdit,
  onDelete,
  show,
  onToggle,
}) => (
  <div className="relative">
    <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded-full">
      <BsThreeDots />
    </button>
    {show && (
      <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
        <button
          onClick={onEdit}
          className="w-full px-4 py-2 text-left hover:bg-gray-100"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
        >
          Delete
        </button>
      </div>
    )}
  </div>
);

export default CommentDropdownMenu;
