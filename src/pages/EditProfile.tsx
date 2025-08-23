import React, { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const EditProfile: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    country: "",
    password: "",
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          setForm({
            name: user.name || "",
            email: user.email || "",
            country: user.country || "",
            password: "",
          });
          setAvatarUrl(user.avatarUrl || null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    try {
      const res = await api.put("/auth/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Update localStorage user info
      localStorage.setItem("user", JSON.stringify(res.data));
      alert("Profile updated!");
      navigate("/");
    } catch (err) {
      alert("Profile update failed.");
    }
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto m-36"
      encType="multipart/form-data"
    >
      <div className="flex flex-col items-center mb-4">
        {avatarUrl && (
          <img
            src={
              avatarUrl.startsWith("/uploads")
                ? `${import.meta.env.VITE_BACKEND_URL}${avatarUrl}`
                : avatarUrl
            }
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover mb-2 border"
          />
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
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Update Profile
      </button>
    </form>
  );
};

export default EditProfile;
