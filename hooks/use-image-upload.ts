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
   * 1. Validate file size on client side (10MB max)
   * 2. Create FormData with file and folder
   * 3. Simulate progress (since fetch doesn't support progress events)
   * 4. Upload to /api/upload endpoint
   * 5. Server uploads to ImageKit and returns URL
   * 6. Show success/error toast
   */
  const uploadImage = async (
    file: File,
    folder: string = "dev-blog"
  ): Promise<UploadResult | null> => {
    // Validate file size on client side before upload
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB. Please choose a smaller image.",
        variant: "destructive",
      });
      return null;
    }

    // Validate file type on client side
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Only images (JPEG, PNG, WebP, GIF) are allowed.",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);
    setProgress(0);
    
    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Create FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append("file", file); // The image file
      formData.append("folder", folder); // Organize uploads by folder

      // Simulate progress for better UX
      // Note: fetch API doesn't support progress events, so we simulate
      // In production, you might use XMLHttpRequest for real progress
      progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90)); // Increment up to 90%
      }, 200);

      // Upload to our API endpoint (which handles ImageKit upload)
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData, // FormData automatically sets Content-Type header
      });

      if (progressInterval) {
        clearInterval(progressInterval); // Stop progress simulation
      }

      if (!response.ok) {
        // Handle different error status codes
        let errorMessage = "Upload failed";
        
        if (response.status === 413) {
          errorMessage = "File too large. Maximum size is 10MB.";
        } else if (response.status === 400) {
          // Try to parse JSON error, but handle non-JSON responses
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || "Invalid file. Please check file type and size.";
          } catch {
            // If response is not JSON, use status text or default message
            errorMessage = response.statusText || "Invalid file. Please check file type and size.";
          }
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          // Try to parse JSON error for other status codes
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || "Upload failed";
          } catch {
            errorMessage = response.statusText || "Upload failed";
          }
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response
      let result;
      try {
        result = await response.json(); // { url, fileId, thumbnailUrl }
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server");
      }

      setProgress(100); // Set to 100% on completion

      toast({
        title: "Success",
        description: "Image uploaded successfully",
        variant: "success",
      });

      return result;
    } catch (error) {
      console.error("Upload error:", error);
      if (progressInterval) {
        clearInterval(progressInterval); // Ensure interval is cleared on error
      }
      setProgress(0); // Reset progress on error
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to upload image";
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null; // Return null on error
    } finally {
      // Always reset uploading state
      setUploading(false);
      // Progress will be reset in catch block on error, or kept at 100% on success
    }
  };

  return { uploadImage, uploading, progress };
}
