"use client";

import React from "react";
import Image from "next/image";
import { FiImage, FiX } from "react-icons/fi";

interface CommentInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview?: string | null;
  onRemoveImage?: () => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  showCancel?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
  value,
  onChange,
  onImageChange,
  imagePreview,
  onRemoveImage,
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  submitLabel = "Comment",
  showCancel = false,
}) => (
  <div className="relative">
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 pr-10 border rounded-full resize-none bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      rows={1}
    />
    <label className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700">
      <FiImage className="w-5 h-5" />
      <input
        type="file"
        accept="image/*"
        onChange={onImageChange}
        className="hidden"
      />
    </label>
    {imagePreview && (
      <div className="relative mt-2 inline-block w-80 h-60">
        <Image
          src={imagePreview}
          alt="Preview"
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover rounded-lg"
        />
        {onRemoveImage && (
          <button
            onClick={onRemoveImage}
            className="absolute top-1 right-1 p-1 bg-gray-800 bg-opacity-50 rounded-full text-white hover:bg-opacity-70 z-10"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    )}
    <div className="flex gap-2 mt-2">
      <button
        onClick={onSubmit}
        className="px-4 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
      >
        {submitLabel}
      </button>
      {showCancel && onCancel && (
        <button
          onClick={onCancel}
          className="px-4 py-1 bg-gray-200 rounded-full hover:bg-gray-300"
        >
          Cancel
        </button>
      )}
    </div>
  </div>
);

export default CommentInput;
