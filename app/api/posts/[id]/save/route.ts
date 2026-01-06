import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth(request);

    // Check if already saved
    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId: id } },
    });

    if (existing) {
      return NextResponse.json({ saved: true });
    }

    await prisma.savedPost.create({
      data: {
        user: { connect: { id: userId } },
        post: { connect: { id } },
      },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Error saving post:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
