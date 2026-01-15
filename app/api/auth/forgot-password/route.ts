import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond with success to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate secure token and expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    // Send email with reset link and user name
    await sendPasswordResetEmail(email, resetToken, user.name || "User");

    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request." },
      { status: 500 }
    );
  }
}
