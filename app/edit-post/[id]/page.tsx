"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useImageUpload } from "@/hooks/use-image-upload";
import { usePost, useUpdatePost } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import TagSelector from "@/components/TagSelector";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Edit Post Page - Edit existing post
 * Uses React Query for data fetching and mutations with optimistic updates
 */
export default function EditPost() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: authData } = useAuth();
  const isLoggedIn = !!authData?.user;

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn && authData !== undefined) {
      router.push("/login");
    }
  }, [isLoggedIn, authData, router]);

  const [headline, setHeadline] = useState("");
  const [errorDescription, setErrorDescription] = useState("");
  const [solution, setSolution] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageFileId, setImageFileId] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { uploadImage, uploading } = useImageUpload();
  const { data: post, isLoading: isLoadingPost } = usePost(id || "");
  const updatePost = useUpdatePost();

  // Pre-fill form when post data loads
  useEffect(() => {
    if (post) {
      setHeadline(post.title);
      setErrorDescription(post.description);
      setSolution(post.content);
      setCodeSnippet(post.codeSnippet || "");
      setTags(post.tags || []);
      setImageUrl(post.imageUrl);
    }
  }, [post]);

  const handleTagSelect = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setImagePreview(URL.createObjectURL(file));
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

    if (!id) return;

    // Upload new image to ImageKit if selected
    let uploadedImageUrl = imageUrl;
    let uploadedFileId = imageFileId;

    if (screenshot && !imageUrl) {
      const result = await uploadImage(screenshot, "posts");
      if (result) {
        uploadedImageUrl = result.url;
        uploadedFileId = result.fileId;
      }
    }

    const formData = new FormData();
    formData.append("title", headline);
    formData.append("description", errorDescription);
    formData.append("content", solution);
    formData.append("codeSnippet", codeSnippet);
    formData.append("tags", JSON.stringify(tags));
    if (uploadedImageUrl) {
      formData.append("imageUrl", uploadedImageUrl);
    }
    if (uploadedFileId) {
      formData.append("fileId", uploadedFileId);
    }

    updatePost.mutate(
      { id, formData },
      {
        onSuccess: () => {
          router.push("/posts");
        },
      }
    );
  };

  // Show loading skeleton while fetching post data
  if (isLoadingPost) {
    return (
      <div className="mx-auto pt-32 max-w-9xl px-2 sm:px-4 xl:px-8 pb-8 flex flex-col min-h-screen">
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
    <div className="mx-auto pt-32 max-w-9xl px-2 sm:px-4 xl:px-8 pb-8 flex flex-col min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Edit Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TagSelector onSelectTag={handleTagSelect} />
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-200 text-blue-800 px-2 py-1 rounded"
            >
              {tag}
            </span>
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
          {uploading && (
            <p className="text-sm text-blue-600 mt-2">Uploading image...</p>
          )}
          {(imagePreview || imageUrl) && (
            <div className="mt-2 relative h-32 w-48">
              <Image
                src={imagePreview || imageUrl!}
                alt="Preview"
                fill
                sizes="192px"
                className="object-cover rounded"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
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
        <button
          type="submit"
          disabled={updatePost.isPending || uploading}
          className="bg-blue-500 text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updatePost.isPending ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
}
