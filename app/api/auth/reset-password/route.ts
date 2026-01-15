import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, resetToken, newPassword } = await request.json();

    // Validate input
    if (!email || !resetToken || !newPassword) {
      return NextResponse.json(
        { error: "Email, token, and new password are required." },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 6 characters)
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      !user.resetToken ||
      user.resetToken !== resetToken ||
      !user.resetTokenExpiry ||
      new Date() > user.resetTokenExpiry
    ) {
      return NextResponse.json(
        { error: "Invalid or expired token." },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ message: "Password has been reset." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
