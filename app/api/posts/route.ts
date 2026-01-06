import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, requireAuth } from "@/lib/auth";
import { handleFileUpload } from "@/lib/upload";

// GET all posts
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    const posts = await prisma.post.findMany({
      include: {
        author: true,
        comments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (userId) {
      const postsWithUserState = await Promise.all(
        posts.map(async (post) => {
          const liked = await prisma.postLike.findUnique({
            where: { userId_postId: { userId, postId: post.id } },
          });
          const helpful = await prisma.postHelpful.findUnique({
            where: { userId_postId: { userId, postId: post.id } },
          });
          const likes = await prisma.postLike.count({
            where: { postId: post.id },
          });
          const helpfulCount = await prisma.postHelpful.count({
            where: { postId: post.id },
          });
          return {
            ...post,
            liked: !!liked,
            helpful: !!helpful,
            likes,
            helpfulCount,
          };
        })
      );
      return NextResponse.json(postsWithUserState);
    } else {
      const postsWithCounts = await Promise.all(
        posts.map(async (post) => {
          const likes = await prisma.postLike.count({
            where: { postId: post.id },
          });
          const helpfulCount = await prisma.postHelpful.count({
            where: { postId: post.id },
          });
          return {
            ...post,
            liked: false,
            helpful: false,
            likes,
            helpfulCount,
          };
        })
      );
      return NextResponse.json(postsWithCounts);
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// Create new post
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const formData = await request.formData();
    const headline = formData.get("headline") as string;
    const errorDescription = formData.get("errorDescription") as string;
    const solution = formData.get("solution") as string;
    const codeSnippet = formData.get("codeSnippet") as string;
    const tagsStr = formData.get("tags") as string;
    const screenshotFile = formData.get("screenshot") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const fileId = formData.get("fileId") as string | null;

    if (!headline || !solution) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let finalImageUrl: string | null = imageUrl;
    let finalFileId: string | null = fileId;

    // If screenshot file provided, upload it (legacy support)
    if (screenshotFile && !imageUrl) {
      // Pass File directly to handleFileUpload (fixes request body consumption issue)
      const uploaded = await handleFileUpload(screenshotFile, "posts");
      if (uploaded) {
        finalImageUrl = uploaded.url;
        finalFileId = uploaded.fileId;
      }
    }

    const tags = tagsStr ? JSON.parse(tagsStr) : [];

    const newPost = await prisma.post.create({
      data: {
        title: headline,
        description: errorDescription || "",
        content: solution,
        codeSnippet: codeSnippet || "",
        createdAt: new Date(),
        tags,
        imageUrl: finalImageUrl,
        fileId: finalFileId,
        likes: 0,
        helpfulCount: 0,
        author: { connect: { id: userId } },
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
