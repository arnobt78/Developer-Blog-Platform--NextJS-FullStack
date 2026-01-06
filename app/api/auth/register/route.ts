import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { handleFileUpload } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const country = formData.get("country") as string;
    const avatarFile = formData.get("avatar") as File | null;

    const hashedPassword = await bcrypt.hash(password, 10);

    let avatarUrl: string | null = null;
    if (avatarFile) {
      const uploaded = await handleFileUpload(request, "avatar", "avatars");
      if (uploaded) {
        avatarUrl = uploaded.url;
      }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        country,
        avatarUrl,
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
