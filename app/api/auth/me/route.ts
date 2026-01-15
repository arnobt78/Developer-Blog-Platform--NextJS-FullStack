import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getUserIdFromRequest, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleFileUpload } from "@/lib/upload";
import { deleteFromImageKit } from "@/lib/imagekit";

/**
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/**
 * Update current user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth();

    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string | null;
    const country = formData.get("country") as string | null;
    const password = formData.get("password") as string | null;
    const avatarFile = formData.get("avatar") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const fileId = formData.get("fileId") as string | null;

    // Fetch current user to get old avatar fileId
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, fileId: true },
    });

    const updateData: {
      name?: string;
      email?: string;
      country?: string;
      password?: string;
      avatarUrl?: string;
      fileId?: string;
    } = {};
    if (typeof name === "string") updateData.name = name;
    if (typeof email === "string") updateData.email = email;
    if (typeof country === "string") updateData.country = country;

    if (typeof password === "string" && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Handle avatar/image updates
    // Priority: 1) Direct file upload (avatarFile), 2) Client-side ImageKit upload (imageUrl + fileId)
    if (avatarFile) {
      // Direct file upload (backward compatibility)
      try {
        const uploaded = await handleFileUpload(avatarFile, "avatars");
        if (uploaded) {
          updateData.avatarUrl = uploaded.url;
          updateData.fileId = uploaded.fileId;
          // Delete old image from ImageKit if exists and different
          if (currentUser?.fileId && currentUser.fileId !== uploaded.fileId) {
            try {
              await deleteFromImageKit(currentUser.fileId);
            } catch (error) {
              // Ignore file not found errors
              console.warn("Error deleting old avatar:", error);
            }
          }
          console.log("Avatar uploaded successfully:", uploaded.url);
        } else {
          console.warn("Avatar upload returned null - file might be invalid");
        }
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
      }
    } else if (fileId) {
      // New image uploaded via client-side ImageKit
      if (currentUser?.fileId && currentUser.fileId !== fileId) {
        // Delete old image from ImageKit if different
        try {
          await deleteFromImageKit(currentUser.fileId);
        } catch (error) {
          // Ignore file not found errors
          console.warn("Error deleting old avatar:", error);
        }
      }
      updateData.fileId = fileId;
      // Use imageUrl from formData if provided
      if (imageUrl !== null) {
        updateData.avatarUrl = imageUrl || null; // Empty string means remove image
      }
    } else if (imageUrl !== null) {
      // imageUrl explicitly provided in formData (could be empty string to remove)
      if (imageUrl === "" && currentUser?.fileId) {
        // Image removed by user: delete old image from ImageKit and clear fields
        try {
          await deleteFromImageKit(currentUser.fileId);
        } catch (error) {
          // Ignore file not found errors
          console.warn("Error deleting old avatar:", error);
        }
        updateData.avatarUrl = null;
        updateData.fileId = null;
      } else if (imageUrl) {
        // New imageUrl provided (from client-side upload)
        // If old fileId exists and is different, delete it from ImageKit
        // Note: This case is less common since fileId should be provided with imageUrl
        if (currentUser?.fileId && currentUser.avatarUrl !== imageUrl) {
          try {
            await deleteFromImageKit(currentUser.fileId);
          } catch (error) {
            // Ignore file not found errors
            console.warn("Error deleting old avatar:", error);
          }
        }
        updateData.avatarUrl = imageUrl;
      }
      // If imageUrl is null, we preserve existing values (already set above)
    }

    // Only update if there's data to update
    if (Object.keys(updateData).length === 0) {
      // No changes to make, return current user data
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          country: true,
          avatarUrl: true,
        },
      });
      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(currentUser);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        avatarUrl: true,
        fileId: true,
      },
    });

    // Return all updated fields for UI/session
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      country: user.country,
      avatarUrl: user.avatarUrl,
      fileId: user.fileId,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Profile update failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
