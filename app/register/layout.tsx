import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - Join the Developer Community",
  description:
    "Create your free account on Dev-Bug-Coder-Blog. Join thousands of developers sharing coding errors, solutions, and learning together.",
  keywords: [
    "register",
    "sign up",
    "create account",
    "join community",
    "developer registration",
    "new user",
  ],
  openGraph: {
    title: "Register - Dev-Bug-Coder-Blog",
    description:
      "Join the developer community and start sharing your coding experiences.",
    url: "https://dev-bug-coder-blog.vercel.app/register",
  },
  robots: {
    index: false, // Don't index registration pages
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
