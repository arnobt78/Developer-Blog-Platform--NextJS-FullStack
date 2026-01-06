"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import Link from "next/link";
import Image from "next/image";

export default function Notifications() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  // Mark all as read on mount
  React.useEffect(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  return (
    <div className="max-w-2xl mx-auto mt-32 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
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
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                n.isRead ? "bg-gray-50" : "bg-blue-50 border-blue-300"
              }`}
            >
              {n.fromUser && (
                <div className="relative w-10 h-10">
                  <Image
                    src={
                      n.fromUser.avatarUrl ||
                      `https://robohash.org/${n.fromUser.name}.png?size=80x80`
                    }
                    alt={n.fromUser.name}
                    fill
                    className="rounded-full object-cover border"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold">
                  {n.fromUser ? n.fromUser.name : "Someone"}
                </div>
                <div className="text-gray-700">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {n.postId && (
                <Link
                  href={`/post/${n.postId}`}
                  className="text-blue-600 underline text-sm"
                >
                  View Post
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
