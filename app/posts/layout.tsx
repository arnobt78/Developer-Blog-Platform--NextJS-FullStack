import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Posts - Coding Errors & Solutions",
  description:
    "Browse all developer posts about coding errors, bugs, and their solutions. Search by tags, filter posts, and learn from the community's shared experiences.",
  keywords: [
    "coding posts",
    "programming errors",
    "bug solutions",
    "developer community",
    "code fixes",
    "error logs",
    "debugging help",
  ],
  openGraph: {
    title: "All Posts - Dev-Bug-Coder-Blog",
    description:
      "Browse all developer posts about coding errors, bugs, and their solutions.",
    url: "https://dev-bug-coder-blog.vercel.app/posts",
  },
};

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
