import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get saved posts for current user
 * Returns empty array if user is not authenticated (for better UX)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    // If user is not authenticated, return empty array instead of error
    // This allows the UI to work even when user is not logged in
    if (!userId) {
      return NextResponse.json([]);
    }

    const saved = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json(saved.map((s) => s.post));
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    // Return empty array on error to prevent UI breaking
    return NextResponse.json([], { status: 200 });
  }
}
