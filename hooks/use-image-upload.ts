/**
 * Custom hook for image uploads to ImageKit
 * Provides reusable upload functionality with progress tracking
 * 
 * Why a custom hook?
 * - Reusable across multiple components (posts, comments, profile)
 * - Encapsulates upload logic and state
 * - Provides consistent error handling
 * - Progress tracking for better UX
 */

"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface UploadResult {
  url: string; // Public URL of uploaded image
  fileId: string; // Unique ID for the file in ImageKit
  thumbnailUrl?: string; // Optional thumbnail URL
}

/**
 * Custom hook for handling image uploads
 * 
 * Returns:
 * - uploadImage: Function to upload a file
 * - uploading: Boolean indicating upload in progress
 * - progress: Number (0-100) indicating upload progress
 * 
 * Usage:
 * const { uploadImage, uploading, progress } = useImageUpload();
 * const result = await uploadImage(file, "posts");
 */
export function useImageUpload() {
  // Local state for upload status
  const [uploading, setUploading] = useState(false); // Is upload in progress?
  const [progress, setProgress] = useState(0); // Upload progress (0-100)

  /**
   * Upload image to server (which uploads to ImageKit)
   * 
   * @param file - File object to upload
   * @param folder - Folder name in ImageKit (organizes uploads)
   * @returns UploadResult with URL and fileId, or null on error
   * 
   * Flow:
   * 1. Create FormData with file and folder
   * 2. Simulate progress (since fetch doesn't support progress events)
   * 3. Upload to /api/upload endpoint
   * 4. Server uploads to ImageKit and returns URL
   * 5. Show success/error toast
   */
  const uploadImage = async (
    file: File,
    folder: string = "dev-blog"
  ): Promise<UploadResult | null> => {
    setUploading(true);
    setProgress(0);

    try {
      // Create FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append("file", file); // The image file
      formData.append("folder", folder); // Organize uploads by folder

      // Simulate progress for better UX
      // Note: fetch API doesn't support progress events, so we simulate
      // In production, you might use XMLHttpRequest for real progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90)); // Increment up to 90%
      }, 200);

      // Upload to our API endpoint (which handles ImageKit upload)
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData, // FormData automatically sets Content-Type header
      });

      clearInterval(progressInterval); // Stop progress simulation
      setProgress(100); // Set to 100% on completion

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json(); // { url, fileId, thumbnailUrl }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      return result;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      return null; // Return null on error
    } finally {
      // Always reset state, even on error
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadImage, uploading, progress };
}
