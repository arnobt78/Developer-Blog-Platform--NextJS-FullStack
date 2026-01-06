import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, requireAuth } from "@/lib/auth";
import { handleFileUpload } from "@/lib/upload";
import { deleteFromImageKit } from "@/lib/imagekit";

// GET single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        comments: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let liked = false;
    let helpful = false;
    if (userId) {
      const likedObj = await prisma.postLike.findUnique({
        where: { userId_postId: { userId, postId: id } },
      });
      const helpfulObj = await prisma.postHelpful.findUnique({
        where: { userId_postId: { userId, postId: id } },
      });
      liked = !!likedObj;
      helpful = !!helpfulObj;
    }

    const likes = await prisma.postLike.count({ where: { postId: id } });
    const helpfulCount = await prisma.postHelpful.count({
      where: { postId: id },
    });

    return NextResponse.json({
      ...post,
      liked,
      helpful,
      likes,
      helpfulCount,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// Edit a post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth(request);

    // Only allow the author to edit
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const content = formData.get("content") as string;
    const codeSnippet = formData.get("codeSnippet") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const fileId = formData.get("fileId") as string | null;
    const tagsStr = formData.get("tags") as string;
    const screenshotFile = formData.get("screenshot") as File | null;

    let updatedImageUrl = imageUrl;
    let updatedFileId = post.fileId;

    // If new screenshot file provided, upload it
    if (screenshotFile) {
      // Pass File directly to handleFileUpload (fixes request body consumption issue)
      const uploaded = await handleFileUpload(screenshotFile, "posts");
      if (uploaded) {
        // Delete old image from ImageKit if exists
        if (post.fileId) {
          await deleteFromImageKit(post.fileId);
        }
        updatedImageUrl = uploaded.url;
        updatedFileId = uploaded.fileId;
      }
    } else if (fileId) {
      // New image uploaded via client-side ImageKit
      if (post.fileId && post.fileId !== fileId) {
        await deleteFromImageKit(post.fileId);
      }
      updatedFileId = fileId;
    }

    const tags = tagsStr ? JSON.parse(tagsStr) : [];

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title,
        description,
        content,
        codeSnippet,
        tags,
        imageUrl: updatedImageUrl,
        fileId: updatedFileId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error editing post:", error);
    return NextResponse.json({ error: "Failed to edit post" }, { status: 500 });
  }
}

// Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth(request);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Delete image from ImageKit if exists
    if (post.fileId) {
      await deleteFromImageKit(post.fileId);
    }

    // Delete all comment images from ImageKit before deleting comments
    const comments = await prisma.comment.findMany({
      where: { postId: id },
      select: { fileId: true },
    });

    for (const comment of comments) {
      if (comment.fileId) {
        await deleteFromImageKit(comment.fileId);
      }
    }

    // Delete all related records first
    await prisma.savedPost.deleteMany({ where: { postId: id } });
    await prisma.postLike.deleteMany({ where: { postId: id } });
    await prisma.postHelpful.deleteMany({ where: { postId: id } });
    await prisma.comment.deleteMany({ where: { postId: id } });
    await prisma.report.deleteMany({ where: { postId: id } });

    // Now delete the post
    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
