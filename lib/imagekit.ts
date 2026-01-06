/**
 * ImageKit configuration and utilities
 * Handles image uploads and URL generation
 */

import ImageKit from "imagekit";

// Server-side ImageKit instance (with private key)
export const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

/**
 * Upload image to ImageKit
 * @param file File buffer or base64
 * @param fileName File name
 * @param folder Optional folder path
 */
export async function uploadToImageKit(
  file: Buffer | string,
  fileName: string,
  folder: string = "dev-blog"
) {
  try {
    const result = await imagekit.upload({
      file,
      fileName,
      folder,
      useUniqueFileName: true,
      tags: ["dev-blog"],
    });

    return {
      url: result.url,
      fileId: result.fileId,
      filePath: result.filePath,
      thumbnailUrl: result.thumbnailUrl,
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw new Error("Failed to upload image to ImageKit");
  }
}

/**
 * Delete image from ImageKit
 * @param fileId ImageKit file ID
 */
export async function deleteFromImageKit(fileId: string) {
  try {
    await imagekit.deleteFile(fileId);
    return { success: true };
  } catch (error) {
    console.error("ImageKit delete error:", error);
    throw new Error("Failed to delete image from ImageKit");
  }
}

/**
 * Generate optimized image URL with transformations
 * @param path Image path or URL
 * @param options Transformation options
 */
export function getOptimizedImageUrl(
  path: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "avif" | "jpg" | "png";
  } = {}
) {
  const { width, height, quality = 80, format = "auto" } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w-${width}`);
  if (height) transformations.push(`h-${height}`);
  transformations.push(`q-${quality}`);
  transformations.push(`f-${format}`);

  const transformation = transformations.join(",");

  // If it's already an ImageKit URL, add transformations
  if (path.includes("ik.imagekit.io")) {
    const url = new URL(path);
    const pathParts = url.pathname.split("/");
    // Insert transformation before the file path
    pathParts.splice(3, 0, `tr:${transformation}`);
    url.pathname = pathParts.join("/");
    return url.toString();
  }

  // Otherwise, construct ImageKit URL
  return `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/tr:${transformation}${path}`;
}
