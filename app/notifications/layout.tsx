import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications - Stay Updated",
  description:
    "View your notifications for likes, comments, helpful marks, and interactions on your posts in the Dev-Bug-Coder-Blog community.",
  keywords: [
    "notifications",
    "updates",
    "alerts",
    "activity feed",
    "user notifications",
  ],
  openGraph: {
    title: "Notifications - Dev-Bug-Coder-Blog",
    description:
      "Stay updated with your community interactions and notifications.",
    url: "https://dev-bug-coder-blog.vercel.app/notifications",
  },
  robots: {
    index: false, // Don't index user-specific pages
    follow: true,
  },
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
