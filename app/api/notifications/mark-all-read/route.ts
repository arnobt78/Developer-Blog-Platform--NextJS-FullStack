import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

// Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    // Return success if user is not authenticated (no-op)
    if (!userId) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Get count of unread notifications before updating
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // Only update if there are unread notifications
    if (unreadCount > 0) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true, count: unreadCount });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
