import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

/**
 * Get notifications for current user
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

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: true,
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Return empty array on error to prevent UI breaking
    // Log the error for debugging
    return NextResponse.json([], { status: 200 });
  }
}
