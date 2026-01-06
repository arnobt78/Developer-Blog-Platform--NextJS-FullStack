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

    await prisma.savedPost.deleteMany({
      where: { userId, postId: id },
    });

    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error("Error unsaving post:", error);
    return NextResponse.json(
      { error: "Failed to unsave post" },
      { status: 500 }
    );
  }
}
