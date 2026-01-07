/**
 * Refactored Navbar using React Query
 * Uses useAuth and useNotifications hooks for cached data
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { FiSearch, FiMenu, FiX } from "react-icons/fi";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Search state
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use React Query hooks for auth and notifications
  const { data: authData, isLoading } = useAuth();
  const user = authData?.user;
  const unreadCount = useUnreadCount();
  const logoutMutation = useLogout();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin = user && user.email === adminEmail;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Posts", path: "/posts" },
    ...(user ? [{ name: "Create Post", path: "/create-post" }] : []),
  ];

  useEffect(() => {
    setSearch("");
  }, [pathname]);

  // Search submit handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/posts?search=${encodeURIComponent(search.trim())}`);
      setIsMenuOpen(false);
      setSearch("");
    }
  };

  return (
    <>
      <nav className="bg-slate-200 shadow-xl fixed top-0 left-0 w-full z-50 px-2 sm:px-4 xl:px-8">
        <div className="max-w-9xl mx-auto flex items-center justify-between md:flex-row">
          {/* Logo */}
          <div className="flex items-start">
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/logo.png"
                alt="Logo"
                width={96}
                height={96}
                className="h-24 w-auto hover:scale-105 transition-transform duration-300"
                style={{ height: "auto" }}
              />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex items-start">
            <form
              onSubmit={handleSearchSubmit}
              className="relative w-full max-w-lg"
              style={{ minWidth: 200 }}
            >
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts or tags..."
                className="search-input pl-10 pr-4 py-2 border-b-2 border-gray-300 focus:outline-none focus:border-blue-400 transition-colors w-full"
              />
              <button
                type="submit"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
                aria-label="Search"
                tabIndex={-1}
                style={{ background: "none", border: "none" }}
              >
                <FiSearch />
              </button>
            </form>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center justify-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="text-slate-700 font-courier text-pretty font-bold text-xl hover:text-blue-500 hover:scale-110 transition-transform duration-300"
              >
                {link.name}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  href="/login"
                  className="text-slate-700 font-courier text-pretty font-bold text-xl hover:text-blue-500 hover:scale-110 transition-transform duration-300"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-slate-700 font-courier text-pretty font-bold text-xl hover:text-blue-500 hover:scale-110 transition-transform duration-300"
                >
                  Register
                </Link>
              </>
            )}
            {user && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none ml-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-400 bg-gray-200">
                      <Image
                        src={
                          // Priority: Use uploaded image if available, otherwise use avatar fallback
                          // Check for both null/undefined and empty string
                          user.avatarUrl && user.avatarUrl.trim() !== ""
                            ? user.avatarUrl
                            : `https://robohash.org/${
                                user.name || "user"
                              }.png?size=80x80`
                        }
                        alt="avatar"
                        fill
                        sizes="40px"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-slate-700 font-courier text-pretty font-bold text-xl hover:text-blue-500">
                      Welcome, {user.name ? user.name.split(" ")[0] : "User"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-50 bg-slate-100 border border-gray-200 shadow-lg"
                >
                  <DropdownMenuItem asChild>
                    <Link
                      href="/notifications"
                      prefetch={false}
                      className="w-full p-4 text-slate-700 font-courier text-pretty font-bold text-xl hover:bg-white hover:text-blue-500 cursor-pointer focus:bg-white focus:text-blue-500 relative flex items-center"
                    >
                      <span className="flex-1">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold ml-2">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/saved-posts"
                      prefetch={false}
                      className="w-full p-4 text-slate-700 font-courier text-pretty font-bold text-xl hover:bg-white hover:text-blue-500 cursor-pointer focus:bg-white focus:text-blue-500"
                    >
                      Saved Posts
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-gray-300" />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin/reports"
                          prefetch={false}
                          className="w-full p-4 text-slate-700 font-courier text-pretty font-bold text-xl hover:bg-white hover:text-blue-500 cursor-pointer focus:bg-white focus:text-blue-500"
                        >
                          Admin Reports
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-gray-300" />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/edit-profile"
                      prefetch={false}
                      className="w-full p-4 text-slate-700 font-courier text-pretty font-bold text-xl hover:bg-white hover:text-blue-500 cursor-pointer focus:bg-white focus:text-blue-500"
                    >
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-300" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="w-full p-4 text-slate-700 font-courier text-pretty font-bold text-xl hover:bg-white hover:text-blue-500 cursor-pointer focus:bg-white focus:text-blue-500"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Burger Menu for Small Screens */}
          <div className="flex items-center justify-end md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-500 focus:outline-none hover:scale-105 transition-transform duration-300"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Full-Screen Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex flex-col items-center justify-center text-white">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-5 right-5 text-white text-2xl"
          >
            <FiX />
          </button>
          {/* Mobile Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mb-8 w-3/4 flex"
            style={{ maxWidth: 400 }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts or tags..."
              className="px-3 py-2 rounded-l-lg border border-gray-300 text-black w-full"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 flex items-center"
              aria-label="Search"
            >
              <FiSearch />
            </button>
          </form>
          <div className="flex flex-col items-center space-y-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="text-lg uppercase font-medium hover:text-blue-500 hover:scale-105 transition-transform duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  href="/login"
                  className="text-lg uppercase font-medium hover:text-blue-500 hover:scale-105 transition-transform duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-lg uppercase font-medium hover:text-blue-500 hover:scale-105 transition-transform duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
            {user && (
              <div className="flex flex-col items-center space-y-2 mt-4">
                <Link
                  href="/notifications"
                  prefetch={false}
                  className="block px-4 py-2 hover:bg-gray-100 text-black rounded relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/saved-posts"
                  prefetch={false}
                  className="block px-4 py-2 hover:bg-gray-100 text-black rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Saved Posts
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/reports"
                    prefetch={false}
                    className="block px-4 py-2 hover:bg-gray-100 text-black rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Reports
                  </Link>
                )}
                <Link
                  href="/edit-profile"
                  prefetch={false}
                  className="block px-4 py-2 hover:bg-gray-100 text-black rounded"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Edit Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-black rounded"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
