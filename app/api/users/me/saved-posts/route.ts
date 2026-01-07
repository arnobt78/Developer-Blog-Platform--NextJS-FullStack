import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get saved posts for current user
 * Returns empty array if user is not authenticated (for better UX)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    // If user is not authenticated, return empty array instead of error
    // This allows the UI to work even when user is not logged in
    if (!userId) {
      return NextResponse.json([]);
    }

    const saved = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: true,
            comments: true,
          },
        },
      },
    });

    // Add user-specific data (liked, helpful status) and counts to each post
    const postsWithUserState = await Promise.all(
      saved.map(async (s) => {
        const post = s.post;
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
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    // Return empty array on error to prevent UI breaking
    return NextResponse.json([], { status: 200 });
  }
}
