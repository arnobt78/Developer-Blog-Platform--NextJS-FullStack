import axios from "axios";
import { Post, Comment, Notification } from "@/types";

/**
 * Create axios instance for API calls
 *
 * In Next.js, we use relative URLs since API routes are in the same app
 * This works in both development and production without hardcoding URLs
 *
 * For client-side requests, we use relative paths which automatically
 * resolve to the current domain (localhost in dev, vercel.app in production)
 */
export const api = axios.create({
  baseURL: "/api", // Relative URL - works in dev and production
  withCredentials: true, // Important: This sends NextAuth session cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// Fetch post details by ID
export const fetchPostDetails = async (id: string): Promise<Post> => {
  const response = await api.get<Post>(`/posts/${id}`);
  return response.data;
};

// Fetch comments for a post
export const fetchComments = async (postId: string): Promise<Comment[]> => {
  const res = await api.get<Comment[]>(`/comments/post/${postId}`);
  return res.data;
};

// Fetch notifications
export const fetchNotifications = async (): Promise<Notification[]> => {
  try {
    const res = await api.get("/notifications");
    return res.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};
