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
    const userId = await requireAuth();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.postHelpful.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.postHelpful.delete({
        where: { userId_postId: { userId, postId } },
      });
    } else {
      await prisma.postHelpful.create({
        data: { userId, postId },
      });
    }

    const helpfulCount = await prisma.postHelpful.count({
      where: { postId },
    });

    // Notify post author if not self
    if (post.authorId !== userId) {
      await createNotification({
        userId: post.authorId,
        type: "helpful",
        postId,
        fromUserId: userId,
        message: `Your post was marked helpful.`,
      });
    }

    return NextResponse.json({ helpful: !existing, helpfulCount });
  } catch (error) {
    console.error("Error toggling helpful:", error);
    return NextResponse.json(
      { error: "Failed to toggle helpful" },
      { status: 500 }
    );
  }
}
