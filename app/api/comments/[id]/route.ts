import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { deleteFromImageKit } from "@/lib/imagekit";
import { handleFileUpload } from "@/lib/upload";

// Edit a comment
export async function PUT(
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
        { error: "Not authorized to edit this comment" },
        { status: 403 }
      );
    }

    // Handle both JSON and FormData requests
    let content: string;
    let imageUrl: string | null = null;
    let fileId: string | null = null;
    let imageFile: File | null = null;

    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      // JSON request (legacy support)
      const body = await request.json();
      content = body.content;
    } else {
      // FormData request (supports image updates)
      const formData = await request.formData();
      content = formData.get("content") as string;
      imageUrl = formData.get("imageUrl") as string | null;
      fileId = formData.get("fileId") as string | null;
      imageFile = formData.get("image") as File | null;
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Initialize with existing values to preserve them if not changed
    let updatedImageUrl = comment.imageUrl || null;
    let updatedFileId = comment.fileId || null;

    // Handle image updates
    if (imageFile) {
      // New image file provided, upload it
      const uploaded = await handleFileUpload(imageFile, "comments");
      if (uploaded) {
        // Delete old image from ImageKit if exists
        if (comment.fileId) {
          try {
            await deleteFromImageKit(comment.fileId);
          } catch (error) {
            // Ignore file not found errors
          }
        }
        updatedImageUrl = uploaded.url;
        updatedFileId = uploaded.fileId;
      }
    } else if (fileId) {
      // New image uploaded via client-side ImageKit
      if (comment.fileId && comment.fileId !== fileId) {
        // Delete old image from ImageKit if different
        try {
          await deleteFromImageKit(comment.fileId);
        } catch (error) {
          // Ignore file not found errors
        }
      }
      updatedFileId = fileId;
      // Use imageUrl from formData if provided, otherwise keep existing
      if (imageUrl) {
        updatedImageUrl = imageUrl;
      }
    } else if (imageUrl !== null) {
      // imageUrl explicitly provided in formData (could be empty string to remove)
      if (imageUrl === "" && comment.fileId) {
        // Image removed by user: delete old image from ImageKit and clear fields
        try {
          await deleteFromImageKit(comment.fileId);
        } catch (error) {
          // Ignore file not found errors
        }
        updatedImageUrl = null;
        updatedFileId = null;
      } else if (imageUrl) {
        // New imageUrl provided (from client-side upload)
        // If old fileId exists and imageUrl changed, delete old image from ImageKit
        if (comment.fileId && comment.imageUrl !== imageUrl) {
          try {
            await deleteFromImageKit(comment.fileId);
          } catch (error) {
            // Ignore file not found errors
          }
        }
        updatedImageUrl = imageUrl;
        // Note: fileId should be provided separately if it's a new upload
        // If not provided, we preserve existing fileId
      }
      // If imageUrl is null, we preserve existing values (already set above)
    }
    // If imageUrl is null and fileId is null, we keep existing values (already set above)

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content,
        imageUrl: updatedImageUrl,
        fileId: updatedFileId,
      },
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

    // Helper: recursively delete all descendants
    async function deleteDescendants(parentId: string) {
      const children = await prisma.comment.findMany({ where: { parentId } });
      for (const child of children) {
        // Recursively delete grandchildren
        await deleteDescendants(child.id);
        // Delete likes/helpfuls for child
        await prisma.commentLike.deleteMany({ where: { commentId: child.id } });
        await prisma.commentHelpful.deleteMany({
          where: { commentId: child.id },
        });
        // Delete image from ImageKit if exists
        if (child.fileId) {
          try {
            await deleteFromImageKit(child.fileId);
          } catch {}
        }
        // Delete the child comment
        await prisma.comment.delete({ where: { id: child.id } });
      }
    }

    // Recursively delete all descendants first
    await deleteDescendants(id);

    // Delete all related likes and helpfuls for the parent
    await prisma.commentLike.deleteMany({ where: { commentId: id } });
    await prisma.commentHelpful.deleteMany({ where: { commentId: id } });

    // Delete image from ImageKit if exists
    if (comment.fileId) {
      try {
        await deleteFromImageKit(comment.fileId);
      } catch {}
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
