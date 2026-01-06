import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const userId = await requireAuth(request);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.postLike.delete({
        where: { userId_postId: { userId, postId } },
      });
    } else {
      await prisma.postLike.create({
        data: { userId, postId },
      });
    }

    const likes = await prisma.postLike.count({
      where: { postId: postId },
    });

    // Notify post author if not self
    if (post.authorId !== userId) {
      await createNotification({
        userId: post.authorId,
        type: "like",
        postId,
        fromUserId: userId,
        message: `Your post was liked.`,
      });
    }

    return NextResponse.json({ liked: !existing, likes });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
