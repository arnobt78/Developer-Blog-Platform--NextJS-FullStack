import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Posts - Your Bookmarked Solutions",
  description:
    "Access your saved posts and bookmarked coding solutions. Keep track of important bug fixes and solutions you want to reference later.",
  keywords: [
    "saved posts",
    "bookmarked solutions",
    "favorite posts",
    "saved bugs",
    "my bookmarks",
  ],
  openGraph: {
    title: "Saved Posts - Dev-Bug-Coder-Blog",
    description: "Access your saved posts and bookmarked coding solutions.",
    url: "https://dev-bug-coder-blog.vercel.app/saved-posts",
  },
  robots: {
    index: false, // Don't index user-specific pages
    follow: true,
  },
};

export default function SavedPostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
