import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getUserIdFromRequest, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleFileUpload } from "@/lib/upload";

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

    const updateData: {
      name?: string;
      email?: string;
      country?: string;
      password?: string;
      avatarUrl?: string;
    } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (country) updateData.country = country;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Upload avatar to ImageKit if provided
    if (avatarFile) {
      try {
        // Pass File directly to handleFileUpload (fixes request body consumption issue)
        const uploaded = await handleFileUpload(avatarFile, "avatars");
        if (uploaded) {
          updateData.avatarUrl = uploaded.url;
          console.log("Avatar uploaded successfully:", uploaded.url);
        } else {
          console.warn("Avatar upload returned null - file might be invalid");
        }
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
        // Don't fail the entire update if avatar upload fails
        // Just log the error and continue with other updates
      }
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
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      country: user.country,
      avatarUrl: user.avatarUrl,
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
