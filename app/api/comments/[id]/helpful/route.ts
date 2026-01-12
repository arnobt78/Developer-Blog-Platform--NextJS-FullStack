import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const userId = await requireAuth();

    const existing = await prisma.commentHelpful.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await prisma.commentHelpful.delete({
        where: { userId_commentId: { userId, commentId } },
      });
    } else {
      await prisma.commentHelpful.create({
        data: { userId, commentId },
      });
    }

    const helpfulCount = await prisma.commentHelpful.count({
      where: { commentId },
    });

    // Notify comment author if not self
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (comment && comment.authorId !== userId) {
      await createNotification({
        userId: comment.authorId,
        type: "comment_helpful",
        postId: comment.postId,
        commentId,
        fromUserId: userId,
        message: `Someone marked your comment as helpful.`,
      });
    }

    return NextResponse.json({
      helpful: !existing,
      helpfulCount,
    });
  } catch (error) {
    console.error("Error toggling comment helpful:", error);
    return NextResponse.json(
      { error: "Failed to toggle helpful" },
      { status: 500 }
    );
  }
}
