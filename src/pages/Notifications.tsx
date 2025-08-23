import React, { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { api } from "../api";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  type: string;
  postId?: string;
  commentId?: string;
  fromUser?: { id: string; name: string; avatarUrl?: string };
  message: string;
  isRead: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Mark all as read on mount
    api.post("/notifications/mark-all-read");
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await api.get<Notification[]>("/notifications");
    setNotifications(res.data);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-32 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
      {loading ? (
        <LoadingSpinner text="Loading notifications..." />
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
                <img
                  src={
                    n.fromUser.avatarUrl
                      ? `${import.meta.env.VITE_BACKEND_URL}${
                          n.fromUser.avatarUrl
                        }`
                      : `https://robohash.org/${n.fromUser.name}.png?size=80x80`
                  }
                  alt={n.fromUser.name}
                  className="w-10 h-10 rounded-full object-cover border"
                />
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
                  to={`/post/${n.postId}`}
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
};

export default Notifications;
