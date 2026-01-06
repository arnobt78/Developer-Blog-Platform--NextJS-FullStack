import { NextRequest } from "next/server";
import { uploadToImageKit } from "./imagekit";

export interface UploadedFile {
  filename: string;
  url: string;
  fileId: string;
  thumbnailUrl?: string;
}

/**
 * Upload a file to ImageKit
 * 
 * Usage:
 * 1. Pass File directly (recommended): handleFileUpload(file, "avatars")
 * 2. Extract from request (legacy): handleFileUpload(request, "avatar", "avatars")
 * 
 * @param fileOrRequest - File object to upload OR NextRequest to extract file from
 * @param folderOrFieldName - Folder name (if File passed) OR field name (if Request passed)
 * @param folder - Folder name (only used when Request is passed)
 * @returns UploadedFile with URL and fileId, or null on error
 */
export async function handleFileUpload(
  fileOrRequest: File | NextRequest,
  folderOrFieldName: string = "dev-blog",
  folder?: string
): Promise<UploadedFile | null> {
  try {
    let file: File | null = null;
    let uploadFolder: string = "dev-blog";

    // If first parameter is a File, use it directly (recommended approach)
    if (fileOrRequest instanceof File) {
      file = fileOrRequest;
      uploadFolder = folderOrFieldName; // Second param is folder when first is File
    } else {
      // Backward compatibility: extract from request (legacy approach)
      // Note: This will fail if request.formData() was already called
      const request = fileOrRequest as NextRequest;
      const fieldName = folderOrFieldName; // Second param is fieldName when first is Request
      uploadFolder = folder || "dev-blog"; // Third param is folder, or default
      const formData = await request.formData();
      file = formData.get(fieldName) as File | null;
    }

    if (!file) {
      return null;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only images are allowed.");
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("File too large. Maximum size is 10MB.");
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to ImageKit
    const result = await uploadToImageKit(buffer, file.name, uploadFolder);

    return {
      filename: file.name,
      url: result.url,
      fileId: result.fileId,
      thumbnailUrl: result.thumbnailUrl,
    };
  } catch (error) {
    console.error("Error handling file upload:", error);
    return null;
  }
}

/**
 * Parse form data and upload files to ImageKit
 * @param request - NextRequest with formData
 * @returns Object with fields (string values) and files (uploaded to ImageKit)
 */
export async function parseFormData(request: NextRequest): Promise<{
  fields: Record<string, string>;
  files: Record<string, UploadedFile>;
}> {
  const formData = await request.formData();
  const fields: Record<string, string> = {};
  const files: Record<string, UploadedFile> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      // Pass File directly to handleFileUpload
      const uploadedFile = await handleFileUpload(value, "dev-blog");
      if (uploadedFile) {
        files[key] = uploadedFile;
      }
    } else {
      fields[key] = value as string;
    }
  }

  return { fields, files };
}
