import React, { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useParams, useNavigate } from "react-router-dom";

import { Post } from "../types";
import CommentSection from "../components/CommentSection";
import PostDropdownMenu from "../components/PostDropdownMenu";
import PostActionsBar from "../components/PostActionsBar";
import PostHeader from "../components/PostHeader";
import PostStats from "../components/PostStats";
import PostContent from "../components/PostContent";
import PostLoginPrompt from "../components/PostLoginPrompt";

import { BsThreeDots } from "react-icons/bs";

import {
  fetchPostDetails,
  toggleLikePost,
  toggleHelpfulPost,
  shareContent,
  savePost,
  unsavePost,
  deletePost,
  reportPost,
} from "../api";

const PostDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = React.useState<Post | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [liked, setLiked] = useState(false);
  const [helpful, setHelpful] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);

  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");
  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null;

  React.useEffect(() => {
    const getPostDetails = async () => {
      try {
        if (!id) {
          throw new Error("Post ID is undefined");
        }
        if (isLoggedIn && id) {
          // Fix: import api from '../api' and use it here
          const { api } = await import("../api");
          const res = await api.get("/users/me/saved-posts");
          const savedPosts = res.data as Post[];
          setSaved(savedPosts.some((p) => p.id === id));
        }
        const postData = await fetchPostDetails(id);
        setPost(postData);
        setLiked(!!postData.liked);
        setHelpful(!!postData.helpful);
        setLikeCount(postData.likes || 0);
        setHelpfulCount(postData.helpfulCount || 0);
      } catch (error) {
        console.error("Error fetching post details:", error);
      } finally {
        setLoading(false);
      }
    };
    getPostDetails();
  }, [id]);

  // Sync local state with post changes (for instant UI update)
  React.useEffect(() => {
    if (post) {
      setLiked(post.liked ?? false);
      setHelpful(post.helpful ?? false);
      setLikeCount(post.likes ?? 0);
      setHelpfulCount(post.helpfulCount ?? 0);
    }
  }, [post]);

  // Handle Like
  const handleLike = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!post) return;
    // Optimistic UI: update local state immediately
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    setPost((prev) =>
      prev
        ? {
            ...prev,
            liked: !liked,
            likes: liked ? likeCount - 1 : likeCount + 1,
          }
        : prev
    );
    try {
      const res = await toggleLikePost(post.id);
      setLiked(res.liked);
      setLikeCount(res.likes);
      setPost((prev) =>
        prev ? { ...prev, liked: res.liked, likes: res.likes } : prev
      );
    } catch (error) {
      setLiked(!!post.liked);
      setLikeCount(post.likes);
      setPost((prev) =>
        prev ? { ...prev, liked: !!post.liked, likes: post.likes } : prev
      );
    }
  };

  // Handle Helpful
  const handleHelpful = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (!post) return;
    // Optimistic UI: update local state immediately
    setHelpful((prev) => !prev);
    setHelpfulCount((prev) => (helpful ? prev - 1 : prev + 1));
    setPost((prev) =>
      prev
        ? {
            ...prev,
            helpful: !helpful,
            helpfulCount: helpful ? helpfulCount - 1 : helpfulCount + 1,
          }
        : prev
    );
    try {
      const res = await toggleHelpfulPost(post.id);
      setHelpful(res.helpful);
      setHelpfulCount(res.helpfulCount);
      setPost((prev) =>
        prev
          ? { ...prev, helpful: res.helpful, helpfulCount: res.helpfulCount }
          : prev
      );
    } catch (error) {
      setHelpful(!!post.helpful);
      setHelpfulCount(post.helpfulCount);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              helpful: !!post.helpful,
              helpfulCount: post.helpfulCount,
            }
          : prev
      );
    }
  };

  // Handle Share
  const handleShare = async () => {
    if (!post) return;

    const shareUrl = window.location.href;
    const shareData = {
      title: post.title,
      text: post.description,
      url: shareUrl,
    };

    const success = await shareContent(shareData);
    if (success) {
      // Show a temporary success message
      const messageDiv = document.createElement("div");
      messageDiv.className =
        "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg";
      messageDiv.textContent = "Link copied to clipboard!";
      document.body.appendChild(messageDiv);
      setTimeout(() => messageDiv.remove(), 2000);
    }
  };

  // Handle Save
  const handleSave = async () => {
    if (!isLoggedIn || !post) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      if (!saved) {
        await savePost(post.id);
        setSaved(true);
        alert("Post saved!");
      } else {
        await unsavePost(post.id);
        setSaved(false);
        alert("Post unsaved!");
      }
    } catch (e) {
      alert("Failed to save/unsave post.");
    }
  };

  // Handle Edit
  const handleEdit = () => {
    if (!post) return;
    navigate(`/edit-post/${post.id}`);
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!post) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(post.id);
      alert("Post deleted!");
      navigate("/posts");
    } catch (e) {
      alert("Failed to delete post.");
    }
  };

  // Handle Report
  const handleReport = async () => {
    if (!isLoggedIn || !post) {
      setShowLoginPrompt(true);
      return;
    }
    const reason = prompt("Why are you reporting this post? (optional)");
    try {
      await reportPost(post.id, reason || undefined);
      setReported(true);
      alert("Post reported! Thank you for your feedback.");
    } catch (e: any) {
      alert(e?.response?.data?.error || "Failed to report post.");
    }
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      const dropdown = document.getElementById("postdetails-dropdown");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  if (loading) {
    return <LoadingSpinner text="Loading post..." />;
  }

  if (!post) {
    return (
      <div className="container mx-auto pt-24 max-w-3xl px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Post not found.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-24 max-w-3xl px-4 pb-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <PostHeader author={post.author} createdAt={post.createdAt} />
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <BsThreeDots className="w-5 h-5 text-gray-500" />
              </button>
              {showDropdown && (
                <PostDropdownMenu
                  isAuthor={
                    currentUser && post && currentUser.id === post.author.id
                  }
                  saved={saved}
                  reported={reported}
                  onSave={handleSave}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReport={handleReport}
                  onClose={() => setShowDropdown(false)}
                />
              )}
            </div>
          </div>

          {/* Content */}
          <PostContent
            title={post.title}
            description={post.description}
            imageUrl={post.imageUrl}
            codeSnippet={post.codeSnippet}
            tags={post.tags || []}
          />

          {/* Stats */}
          <PostStats
            likeCount={likeCount}
            helpfulCount={helpfulCount}
            commentCount={post.comments.length}
            liked={liked}
            helpful={helpful}
          />

          {/* Action Buttons */}
          <PostActionsBar
            liked={liked}
            helpful={helpful}
            likeCount={likeCount}
            helpfulCount={helpfulCount}
            commentCount={post.comments.length}
            onLike={() => {
              // Remove event param to avoid stale closure
              handleLike();
            }}
            onHelpful={() => {
              handleHelpful();
            }}
            onComment={() => {
              if (!isLoggedIn) {
                setShowLoginPrompt(true);
                return;
              }
              // Optionally scroll to comments
            }}
            onShare={handleShare}
          />

          {/* Comments Section */}
          <div className="mt-6">
            <CommentSection postId={post.id} />
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <PostLoginPrompt onClose={() => setShowLoginPrompt(false)} />
      )}
    </div>
  );
};

export default PostDetails;
