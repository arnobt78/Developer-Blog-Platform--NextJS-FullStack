"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useCreatePost } from "@/hooks/use-posts";
import TagSelector from "@/components/TagSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { BsArrowLeft } from "react-icons/bs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

/**
 * Create Post Page - Create or edit posts
 * Uses React Query for data fetching and mutations with optimistic updates
 */
export default function CreatePost() {
  const router = useRouter();
  const { status } = useSession();

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/create-post");
    }
  }, [status, router]);

  const [headline, setHeadline] = useState("");
  const [errorDescription, setErrorDescription] = useState("");
  const [solution, setSolution] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageFileId, setImageFileId] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { uploadImage, uploading, progress } = useImageUpload();
  const createPost = useCreatePost();

  const handleTagSelect = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  /**
   * Remove tag from selected tags
   * @param tag - Tag to remove
   */
  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setImagePreview(URL.createObjectURL(file));
      
      // Upload image immediately when selected
      const result = await uploadImage(file, "posts");
      if (result) {
        setImageUrl(result.url);
        setImageFileId(result.fileId);
      } else {
        // If upload failed, clear the image
        setScreenshot(null);
        setImagePreview(null);
      }
    }
  };

  const handleRemoveImage = () => {
    setScreenshot(null);
    setImagePreview(null);
    setImageUrl(undefined);
    setImageFileId(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Image should already be uploaded when selected
    // Just use the existing imageUrl and imageFileId

    // Create mode
    const formData = new FormData();
    formData.append("headline", headline);
    formData.append("errorDescription", errorDescription);
    formData.append("solution", solution);
    formData.append("codeSnippet", codeSnippet);
    formData.append("tags", JSON.stringify(tags));
    if (imageUrl) {
      formData.append("imageUrl", imageUrl);
    }
    if (imageFileId) {
      formData.append("fileId", imageFileId);
    }

    createPost.mutate(formData, {
      onSuccess: () => {
        router.push("/posts");
      },
    });
  };

  // Show loading skeleton while checking auth
  // This prevents white screen flash during navigation
  if (status === "loading") {
    return (
      <div className="mx-auto pt-32 max-w-9xl px-2 sm:px-4 xl:px-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto pt-32 max-w-9xl px-2 sm:px-4 xl:px-8 pb-8">
      {/* Back Navigation */}
      <button
        onClick={() => router.push("/posts")}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-semibold transition-colors"
      >
        <BsArrowLeft className="w-5 h-5" />
        Back to Posts
      </button>
      <h1 className="text-2xl font-bold mb-4">Create a New Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TagSelector onSelectTag={handleTagSelect} />
        {/* Selected tags with remove functionality */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm border-0 flex items-center gap-1 cursor-pointer hover:bg-blue-300"
            >
              {tag}
              <X
                className="w-3 h-3 hover:text-red-600"
                onClick={() => handleRemoveTag(tag)}
              />
            </Badge>
          ))}
        </div>
        <div>
          <label className="block mb-1">Headline:</label>
          <textarea
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Error Description:</label>
          <textarea
            value={errorDescription}
            onChange={(e) => setErrorDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Upload Screenshot:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {(imagePreview || imageUrl) && (
            <div className="mt-2 relative h-32 w-48">
              <Image
                src={imagePreview || imageUrl!}
                alt="Preview"
                fill
                sizes="192px"
                className="object-cover rounded"
              />
              {!uploading && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              )}
              {/* Upload Progress Bar */}
              {uploading && (
                <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 text-white p-2 rounded-b">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold">{progress}%</span>
                  </div>
                  <p className="text-xs text-center">Uploading image...</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block mb-1">Solution:</label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Code Snippet:</label>
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createPost.isPending || uploading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createPost.isPending ? "Creating..." : "Create Post"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/posts")}
            disabled={createPost.isPending || uploading}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
