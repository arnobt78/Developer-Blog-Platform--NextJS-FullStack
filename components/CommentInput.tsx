"use client";

import React from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

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
  uploading?: boolean;
  uploadProgress?: number;
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
  uploading = false,
  uploadProgress = 0,
}) => {
  // Show cancel button only when there's text in the input or an image preview
  const showCancel = value.trim().length > 0 || !!imagePreview;

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-12 border rounded-full resize-none bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={1}
      />
      <label className="absolute right-3 top-2 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
        <ImagePlus className="w-5 h-5" />
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
          {onRemoveImage && !uploading && (
            <button
              onClick={onRemoveImage}
              className="absolute top-1 right-1 p-1 bg-gray-800 bg-opacity-50 rounded-full text-white hover:bg-opacity-70 z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {/* Upload Progress Bar */}
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 text-white p-2 rounded-b-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold">{uploadProgress}%</span>
              </div>
              <p className="text-xs text-center">Uploading image...</p>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2 mt-2 justify-end">
        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-1 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onSubmit}
          className="px-4 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

export default CommentInput;
