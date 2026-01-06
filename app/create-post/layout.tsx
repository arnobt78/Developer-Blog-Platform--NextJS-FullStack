import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Post - Share Your Coding Error & Solution",
  description:
    "Share your coding error, bug, or problem with the developer community. Post solutions, code snippets, screenshots, and help other developers learn from your experience.",
  keywords: [
    "create post",
    "share bug",
    "post error",
    "coding solution",
    "developer blog",
    "submit bug report",
  ],
  openGraph: {
    title: "Create Post - Dev-Bug-Coder-Blog",
    description:
      "Share your coding error and solution with the developer community.",
    url: "https://dev-bug-coder-blog.vercel.app/create-post",
  },
  robots: {
    index: false, // Don't index the create post page
    follow: true,
  },
};

export default function CreatePostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
