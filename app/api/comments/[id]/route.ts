import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { deleteFromImageKit } from "@/lib/imagekit";

// Edit a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth();
    const { content } = await request.json();

    // Check if user owns the comment
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.author.id !== userId) {
      return NextResponse.json(
        { error: "Not authorized to edit this comment" },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: true,
        commentLikes: true,
        commentHelpfuls: true,
      },
    });

    return NextResponse.json({
      ...updatedComment,
      liked: updatedComment.commentLikes.some((like) => like.userId === userId),
      helpful: updatedComment.commentHelpfuls.some(
        (helpful) => helpful.userId === userId
      ),
      likeCount: updatedComment.commentLikes.length,
      helpfulCount: updatedComment.commentHelpfuls.length,
      commentLikes: undefined,
      commentHelpfuls: undefined,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth();

    // Check if user owns the comment
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.author.id !== userId) {
      return NextResponse.json(
        { error: "Not authorized to delete this comment" },
        { status: 403 }
      );
    }

    // Delete image from ImageKit if exists
    if (comment.fileId) {
      await deleteFromImageKit(comment.fileId);
    }

    await prisma.comment.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
