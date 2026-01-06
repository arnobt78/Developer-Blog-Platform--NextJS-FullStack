import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

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

    return NextResponse.json(saved.map((s) => s.post));
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved posts" },
      { status: 500 }
    );
  }
}
