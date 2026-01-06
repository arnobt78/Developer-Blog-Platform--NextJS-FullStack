import axios from "axios";
import { Post, Comment, Notification } from "@/types";

// Get the backend URL from environment variables with fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Create axios instance with default config
export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
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
