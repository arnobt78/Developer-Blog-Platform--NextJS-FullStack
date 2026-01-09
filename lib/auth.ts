import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface JWTPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// Legacy JWT token functions (for backward compatibility with existing API routes)
export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Get user ID from NextAuth session or legacy JWT token
 * Supports both authentication methods for backward compatibility
 */
export async function getUserIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  // First, try to get session from NextAuth using getToken
  try {
    // Explicitly specify cookie name based on environment
    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";
    
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName,
    });

    if (token?.id) {
      return token.id as string;
    }
  } catch (error) {
    console.error("NextAuth getToken error:", error);
  }

  // Fallback: Check for legacy JWT token in Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    console.log("No auth header found");
    return null;
  }

  const jwtToken = authHeader.split(" ")[1];
  if (!jwtToken) {
    console.log("No JWT token in auth header");
    return null;
  }

  try {
    const decoded = verifyToken(jwtToken);
    return decoded.id;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

// NextAuth v5 configuration
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isCorrectPassword) {
          return null;
        }

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
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatarUrl = "avatarUrl" in user ? user.avatarUrl : undefined;
        token.country = "country" in user ? user.country : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.avatarUrl = token.avatarUrl as string | undefined;
        session.user.country = token.country as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for Vercel production
  debug: process.env.NODE_ENV === "development",
});
