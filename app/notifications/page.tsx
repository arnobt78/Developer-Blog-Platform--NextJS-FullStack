"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useUser } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import Link from "next/link";
import Image from "next/image";

/**
 * Generate dynamic notification message based on type and fromUser
 * Uses fromUser name instead of generic "Someone"
 */
const getNotificationMessage = (
  type: string | undefined,
  fromUserName: string | undefined
): string => {
  const userName = fromUserName || "Someone";

  switch (type) {
    case "like":
      return `${userName} liked your post.`;
    case "helpful":
      return `${userName} marked your post as helpful.`;
    case "comment":
      return `${userName} commented on your post.`;
    case "comment_like":
      return `${userName} liked your comment.`;
    case "comment_helpful":
      return `${userName} marked your comment as helpful.`;
    default:
      return `${userName} interacted with your content.`;
  }
};

export default function Notifications() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const { data: session, status } = useSession();
  const { data: currentUser } = useUser(session?.user?.id);

  // Mark all as read on mount - only once, and only if there are unread notifications
  const markAllReadCalledRef = React.useRef(false);

  // Mark all as read on mount - only if there are unread notifications
  React.useEffect(() => {
    // Check if there are unread notifications
    const hasUnreadNotifications = notifications.some((n) => !n.isRead);
    
    // Only mark as read if:
    // 1. Notifications are loaded (not loading)
    // 2. There are unread notifications
    // 3. Mutation is not pending and not already successful
    // 4. We haven't called it yet (using ref to persist across renders)
    if (
      !isLoading &&
      hasUnreadNotifications &&
      !markAllRead.isPending &&
      !markAllRead.isSuccess &&
      !markAllReadCalledRef.current
    ) {
      markAllRead.mutate();
      markAllReadCalledRef.current = true;
    }
  }, [notifications, isLoading, markAllRead]);

  return (
    <div className="max-w-9xl mx-auto mt-32 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">
        Notifications {!isLoading && <span className="text-gray-600 font-normal text-lg">({notifications.length})</span>}
      </h2>
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-gray-500">No notifications yet.</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => {
            // Construct dynamic message using fromUser name
            const message = getNotificationMessage(n.type, n.fromUser?.name);

            // Determine avatar URL - use fromUser's avatar or fallback to RoboHash
            const avatarUrl = n.fromUser?.avatarUrl
              ? n.fromUser.avatarUrl
              : `https://robohash.org/${
                  n.fromUser?.name || n.fromUser?.id || n.id
                }.png?size=80x80`;

            return (
              <li
                key={n.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  n.isRead ? "bg-gray-50" : "bg-blue-50 border-blue-300"
                }`}
              >
                {/* User Avatar - Always display for all notification types */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={avatarUrl}
                    alt={n.fromUser?.name || "User"}
                    fill
                    sizes="40px"
                    className="rounded-full object-cover border"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-gray-700">{message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {n.postId && (
                  <Link
                    href={`/post/${n.postId}`}
                    className="text-blue-600 underline text-sm hover:text-blue-800 transition-colors"
                  >
                    View Post
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
