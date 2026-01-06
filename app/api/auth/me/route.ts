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
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
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
    const userId = await requireAuth(request);

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

    if (avatarFile) {
      const uploaded = await handleFileUpload(request, "avatar", "avatars");
      if (uploaded) {
        updateData.avatarUrl = uploaded.url;
      }
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
    return NextResponse.json(
      { error: "Profile update failed" },
      { status: 500 }
    );
  }
}
