"use client";

import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUpdateProfile, useUser } from "@/hooks/use-auth";

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
  // Only return null after all hooks
  if (!user) return null; // or a loading skeleton

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("country", form.country);
    if (form.password) {
      formData.append("password", form.password);
    }
    if (avatar) {
      formData.append("avatar", avatar);
    }
    updateProfile.mutate(formData, {
      onSuccess: () => {
        // Redirect after successful update
        router.push("/");
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
        {avatarUrl && (
          <div className="relative w-24 h-24 mb-2">
            <Image
              src={avatarUrl}
              alt="Avatar"
              fill
              sizes="96px"
              className="rounded-full object-cover border"
            />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleAvatarChange} />
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
          disabled={updateProfile.isPending}
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
    </form>
  );
}
