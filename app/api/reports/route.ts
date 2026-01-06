import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// User reports a post
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const { postId, reason } = await request.json();

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

    const report = await prisma.report.create({
      data: {
        postId,
        userId,
        reason: reason || null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error reporting post:", error);
    return NextResponse.json(
      { error: "Failed to report post" },
      { status: 500 }
    );
  }
}

// Admin: get all reports
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    // You can add admin check here if needed

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        post: { include: { author: true } },
        user: true,
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
