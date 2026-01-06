import { NextRequest } from "next/server";
import { uploadToImageKit } from "./imagekit";

export interface UploadedFile {
  filename: string;
  url: string;
  fileId: string;
  thumbnailUrl?: string;
}

export async function handleFileUpload(
  request: NextRequest,
  fieldName: string = "file",
  folder: string = "dev-blog"
): Promise<UploadedFile | null> {
  try {
    const formData = await request.formData();
    const file = formData.get(fieldName) as File | null;

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
    const result = await uploadToImageKit(buffer, file.name, folder);

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

export async function parseFormData(request: NextRequest): Promise<{
  fields: Record<string, string>;
  files: Record<string, UploadedFile>;
}> {
  const formData = await request.formData();
  const fields: Record<string, string> = {};
  const files: Record<string, UploadedFile> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const uploadedFile = await handleFileUpload(request, key);
      if (uploadedFile) {
        files[key] = uploadedFile;
      }
    } else {
      fields[key] = value as string;
    }
  }

  return { fields, files };
}
