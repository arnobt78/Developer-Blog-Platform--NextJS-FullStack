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

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true, post: true },
    });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await prisma.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      });
    } else {
      await prisma.commentLike.create({
        data: { userId, commentId },
      });
    }

    const likeCount = await prisma.commentLike.count({
      where: { commentId },
    });

    // Notify comment author if not self
    if (comment.authorId !== userId) {
      await createNotification({
        userId: comment.authorId,
        type: "comment_like",
        postId: comment.postId,
        commentId,
        fromUserId: userId,
        message: `Someone liked your comment.`,
      });
    }

    return NextResponse.json({ liked: !existing, likeCount });
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
