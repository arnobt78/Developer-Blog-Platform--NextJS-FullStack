import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Access Your Developer Account",
  description:
    "Login to your Dev-Bug-Coder-Blog account to create posts, comment, save posts, and engage with the developer community.",
  keywords: [
    "login",
    "developer login",
    "sign in",
    "user authentication",
    "account access",
  ],
  openGraph: {
    title: "Login - Dev-Bug-Coder-Blog",
    description:
      "Login to access your developer account and engage with the community.",
    url: "https://dev-bug-coder-blog.vercel.app/login",
  },
  robots: {
    index: false, // Don't index login pages
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
