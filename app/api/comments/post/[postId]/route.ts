import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, requireAuth } from "@/lib/auth";
import { handleFileUpload } from "@/lib/upload";
import { createNotification } from "@/lib/notifications";

// Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const userId = getUserIdFromRequest(request);

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: true,
        commentLikes: true,
        commentHelpfuls: true,
      },
      orderBy: [
        { parentId: "asc" }, // Order by parentId first to group replies
        { createdAt: "asc" }, // Then by creation time
      ],
    });

    // Transform comments to include user-specific like/helpful status
    const transformedComments = comments.map((comment) => ({
      ...comment,
      liked: userId
        ? comment.commentLikes.some((like) => like.userId === userId)
        : false,
      helpful: userId
        ? comment.commentHelpfuls.some((helpful) => helpful.userId === userId)
        : false,
      likeCount: comment.commentLikes.length,
      helpfulCount: comment.commentHelpfuls.length,
      commentLikes: undefined,
      commentHelpfuls: undefined,
    }));

    return NextResponse.json(transformedComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// Add comment to a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const userId = await requireAuth(request);

    const formData = await request.formData();
    const content = formData.get("content") as string;
    const parentId = formData.get("parentId") as string | null;
    const imageFile = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const fileId = formData.get("fileId") as string | null;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    let finalImageUrl: string | null = imageUrl;
    let finalFileId: string | null = fileId;

    // If image file provided, upload it (legacy support)
    if (imageFile && !imageUrl) {
      const uploaded = await handleFileUpload(request, "image", "comments");
      if (uploaded) {
        finalImageUrl = uploaded.url;
        finalFileId = uploaded.fileId;
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        createdAt: new Date(),
        imageUrl: finalImageUrl,
        fileId: finalFileId,
        post: { connect: { id: postId } },
        author: { connect: { id: userId } },
        parentId: parentId || null,
      },
      include: {
        author: true,
      },
    });

    // Notify post author if not self
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (post && post.authorId !== userId) {
      await createNotification({
        userId: post.authorId,
        type: "comment",
        postId: post.id,
        commentId: newComment.id,
        fromUserId: userId,
        message: `Someone commented on your post.`,
      });
    }

    return NextResponse.json(
      {
        ...newComment,
        liked: false,
        helpful: false,
        likeCount: 0,
        helpfulCount: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
