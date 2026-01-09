import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

/**
 * Get user ID from NextAuth session (NextAuth v5)
 * This is the ONLY authentication method - no more legacy JWT
 */
export async function getUserIdFromRequest(
  request?: NextRequest
): Promise<string | null> {
  // Get session from NextAuth directly (like feedback-widget)
  try {
    const session = await auth();
    console.log(
      "[AUTH DEBUG] session from auth():",
      JSON.stringify(session, null, 2)
    );
    if (session?.user?.id) {
      console.log(
        "[AUTH DEBUG] ✅ Found user ID from NextAuth session:",
        session.user.id
      );
      return session.user.id;
    } else {
      console.log("[AUTH DEBUG] ❌ No user ID in NextAuth session");
    }
  } catch (error) {
    console.error("[AUTH DEBUG] NextAuth auth() error:", error);
  }

  console.log("[AUTH DEBUG] ❌ No authentication found - returning null");
  return null;
}

export async function requireAuth(request?: NextRequest): Promise<string> {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

// NextAuth v5 configuration
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Required for NextAuth v5 in development and production
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log(
          "[AUTH DEBUG] 🔐 authorize() called with email:",
          credentials?.email
        );
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH DEBUG] ❌ Missing credentials");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          console.log("[AUTH DEBUG] ❌ User not found or no password");
          return null;
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isCorrectPassword) {
          console.log("[AUTH DEBUG] ❌ Incorrect password");
          return null;
        }

        console.log("[AUTH DEBUG] ✅ User authenticated, returning:", {
          id: user.id,
          email: user.email,
          name: user.name,
        });
        return {
          id: user.id,
          email: user.email || "",
          name: user.name,
          avatarUrl: user.avatarUrl || undefined,
          country: user.country || undefined,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log(
          "[AUTH DEBUG] 🎫 jwt() callback - setting token with user:",
          user.id
        );
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatarUrl = "avatarUrl" in user ? user.avatarUrl : undefined;
        token.country = "country" in user ? user.country : undefined;
      }
      console.log("[AUTH DEBUG] 🎫 jwt() callback - token.id:", token.id);
      return token;
    },
    async session({ session, token }) {
      console.log("[AUTH DEBUG] 👤 session() callback - token.id:", token.id);
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.avatarUrl = token.avatarUrl as string | undefined;
        session.user.country = token.country as string | undefined;
      }
      console.log(
        "[AUTH DEBUG] 👤 session() callback - session.user.id:",
        session.user?.id
      );
      return session;
    },
  },
});
