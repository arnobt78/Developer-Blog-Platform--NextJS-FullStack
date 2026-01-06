"use client";

import React from "react";

interface PostDropdownMenuProps {
  isAuthor: boolean;
  saved: boolean;
  reported: boolean;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  onClose: () => void;
}

const PostDropdownMenu: React.FC<PostDropdownMenuProps> = ({
  isAuthor,
  saved,
  reported,
  onSave,
  onEdit,
  onDelete,
  onReport,
  onClose,
}) => {
  return (
    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-10">
      <button
        onClick={() => {
          onSave();
          onClose();
        }}
        className="w-full font-courier px-4 py-2 text-left hover:bg-gray-100"
      >
        {saved ? "Unsave Post" : "Save Post"}
      </button>
      {isAuthor && (
        <>
          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="w-full font-courier px-4 py-2 text-left hover:bg-gray-100"
          >
            Edit Post
          </button>
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full font-courier px-4 py-2 text-left hover:bg-gray-100 text-red-600"
          >
            Delete Post
          </button>
        </>
      )}
      <button
        onClick={() => {
          onReport();
          onClose();
        }}
        className="w-full font-courier px-4 py-2 text-left hover:bg-gray-100"
        disabled={reported}
      >
        {reported ? "Reported" : "Report Post"}
      </button>
    </div>
  );
};

export default PostDropdownMenu;
