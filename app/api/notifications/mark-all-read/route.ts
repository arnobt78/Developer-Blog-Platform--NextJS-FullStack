import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

// Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    // Return success if user is not authenticated (no-op)
    if (!userId) {
      return NextResponse.json({ success: true });
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
