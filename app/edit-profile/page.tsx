"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUpdateProfile, useUser } from "@/hooks/use-auth";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useImageUpload } from "@/hooks/use-image-upload";
import { X } from "lucide-react";

/**
 * Edit Profile Page - Update user profile
 * Uses React Query for data fetching and mutations with cache invalidation
 */

interface EditProfileProps {
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    country?: string;
  } | null;
}

export default function EditProfile({ user: ssrUser }: EditProfileProps) {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  // Always use client-fetched user for latest info, fallback to SSR user for initial render
  const { data: clientUser } = useUser(ssrUser?.id);
  const user = clientUser || ssrUser || null;
  // DEBUG: Log what user prop is received and what is used
  console.log("[EditProfile] ssrUser prop:", JSON.stringify(ssrUser));
  console.log("[EditProfile] clientUser:", JSON.stringify(clientUser));
  console.log("[EditProfile] user used for render:", JSON.stringify(user));
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    country: user?.country || "",
    password: "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatarUrl || null
  );
  const [avatarFileId, setAvatarFileId] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  const { uploadImage, uploading, progress } = useImageUpload();

  // Store baseline values for comparison (only updated after successful save)
  const [baselineValues, setBaselineValues] = useState<{
    name: string;
    email: string;
    country: string;
    avatarUrl: string | null;
  } | null>(null);

  // Initialize baseline values when user data loads (only once, or when explicitly reset)
  useEffect(() => {
    if (user) {
      // Only set baseline if not already set, or if user data has changed significantly
      // This prevents resetting baseline during normal refetches
      if (!baselineValues) {
        setBaselineValues({
          name: user.name || "",
          email: user.email || "",
          country: user.country || "",
          avatarUrl: user.avatarUrl || null,
        });
      }
    }
  }, [user, baselineValues]);

  // Check if form has any changes compared to baseline
  const hasChanges = useMemo(() => {
    if (!baselineValues) return false;

    // Check text fields
    const textChanged =
      form.name !== baselineValues.name ||
      form.email !== baselineValues.email ||
      form.country !== baselineValues.country ||
      form.password !== "";

    // Check avatar changes
    // - If avatar (File) is set, it means a new file was selected (definite change)
    // - If avatarFileId is set, it means a new image was uploaded (definite change)
    // - If avatarUrl changed from baseline and it's a server URL (not blob), it's a change
    const avatarChanged =
      avatar !== null || // New file selected (always a change)
      avatarFileId !== null || // New image uploaded (always a change)
      (avatarUrl !== baselineValues.avatarUrl &&
        avatarUrl !== null &&
        !avatarUrl.startsWith("blob:")); // Server URL changed (not just a preview)

    return textChanged || avatarChanged;
  }, [form, avatar, avatarUrl, baselineValues]);

  // Update form state when user data changes (after successful update)
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        name: user.name || prev.name,
        email: user.email || prev.email,
        country: user.country || prev.country,
        password: "", // Always clear password field after update
      }));
      // Update avatarUrl when user data changes (after successful update)
      // This ensures we show the server-uploaded image, not the local preview
      if (user.avatarUrl) {
        setAvatarUrl(user.avatarUrl);
      }
    }
  }, [user]);

  // Only return null after all hooks
  if (!user) return null; // or a loading skeleton

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));

      // Upload image immediately when selected
      const result = await uploadImage(file, "avatars");
      if (result) {
        setAvatarUrl(result.url);
        setAvatarFileId(result.fileId);
      } else {
        // If upload failed, clear the image
        setAvatar(null);
        setAvatarPreview(null);
        setAvatarUrl(user?.avatarUrl || null);
        setAvatarFileId(null);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
    setAvatarUrl(user?.avatarUrl || null);
    setAvatarFileId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Show confirmation dialog instead of submitting directly
    setShowUpdateConfirm(true);
  };

  const confirmUpdate = () => {
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("country", form.country);
    if (form.password) {
      formData.append("password", form.password);
    }
    // Send imageUrl and fileId from client-side upload (not the file itself)
    if (avatarUrl !== null && avatarUrl !== user?.avatarUrl) {
      // Only send if image was changed (new upload or removed)
      formData.append("imageUrl", avatarUrl || "");
    }
    if (avatarFileId) {
      formData.append("fileId", avatarFileId);
    }
    updateProfile.mutate(formData, {
      onSuccess: (data) => {
        // Stay on edit profile page - update form immediately with server response
        if (data) {
          setForm((prev) => ({
            name: data.name || prev.name,
            email: data.email || prev.email,
            country: data.country || prev.country,
            password: "", // Clear password field after update
          }));
          // Update avatarUrl immediately with server response
          if (data.avatarUrl) {
            setAvatarUrl(data.avatarUrl);
          }
          // Update baseline values to new saved values (so button becomes disabled again)
          setBaselineValues({
            name: data.name || "",
            email: data.email || "",
            country: data.country || "",
            avatarUrl: data.avatarUrl || null,
          });
        }
        // Clear avatar file state after successful upload
        setAvatar(null);
        setAvatarPreview(null);
        setAvatarFileId(null);
        // useUser hook will refetch after query invalidation to keep everything in sync
      },
    });
  };

  if (updateProfile.isPending) {
    return (
      <div className="space-y-4 max-w-9xl mx-auto m-36">
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto m-36"
      encType="multipart/form-data"
    >
      <div className="flex flex-col items-center mb-4">
        {(avatarPreview || avatarUrl) && (
          <div className="relative w-24 h-24 mb-2">
            <Image
              src={avatarPreview || avatarUrl || ""}
              alt="Avatar"
              fill
              sizes="96px"
              className="rounded-full object-cover border"
            />
            {(avatarPreview || avatarFileId) && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                aria-label="Remove avatar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploading}
            className="w-full p-2 border disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {uploading && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span>Uploading image... {progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <input
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        required
        className="w-full p-2 border"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        className="w-full p-2 border"
      />
      <input
        name="country"
        placeholder="Country"
        value={form.country}
        onChange={handleChange}
        className="w-full p-2 border"
      />
      <input
        name="password"
        type="password"
        placeholder="New Password (leave blank to keep current)"
        value={form.password}
        onChange={handleChange}
        className="w-full p-2 border"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={updateProfile.isPending || !hasChanges || uploading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateProfile.isPending ? "Updating..." : "Update Profile"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          disabled={updateProfile.isPending}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      {/* Update Profile Confirmation Dialog */}
      <ConfirmDialog
        open={showUpdateConfirm}
        onOpenChange={setShowUpdateConfirm}
        title="Update Profile"
        description="Are you sure you want to update your profile? Your changes will be saved and reflected across the platform."
        confirmText="Update"
        cancelText="Cancel"
        onConfirm={confirmUpdate}
        variant="default"
      />
    </form>
  );
}
