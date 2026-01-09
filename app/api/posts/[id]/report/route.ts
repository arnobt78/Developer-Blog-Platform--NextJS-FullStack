import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * Report a post endpoint
 * Creates a report record in the database for the specified post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const userId = await requireAuth();
    const { reason } = await request.json();

    // Prevent duplicate reports by same user for same post
    const existing = await prisma.report.findFirst({
      where: { postId, userId, status: "pending" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reported this post." },
        { status: 400 }
      );
    }

    // Create report in database
    const report = await prisma.report.create({
      data: {
        postId,
        userId,
        reason: reason || null,
      },
    });

    return NextResponse.json({ reported: true, report }, { status: 201 });
  } catch (error) {
    console.error("Error reporting post:", error);
    return NextResponse.json(
      { error: "Failed to report post" },
      { status: 500 }
    );
  }
}
