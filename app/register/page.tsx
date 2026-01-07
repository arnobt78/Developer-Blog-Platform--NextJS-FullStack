"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRegister } from "@/hooks/use-auth";

/**
 * Register Page - User registration with avatar upload
 * Uses React Query for form submission with FormData support
 */
export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    country: "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const register = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("country", form.country);
    if (avatar) {
      formData.append("avatar", avatar);
    }
    register.mutate(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto m-36"
      encType="multipart/form-data"
    >
      <div className="flex flex-col items-center">
        <label className="block mb-1">Profile Photo (optional):</label>
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2 relative">
          {avatar ? (
            <Image
              src={URL.createObjectURL(avatar)}
              alt="avatar"
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span className="text-gray-400">No Image</span>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
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
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
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
      <button
        type="submit"
        disabled={register.isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {register.isPending ? "Registering..." : "Register"}
      </button>
    </form>
  );
}
