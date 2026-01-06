import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">
        The page you're looking for doesn't exist.
      </h2>
      <p className="mb-6 text-gray-500">
        It looks like the page you requested could not be found.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
      >
        Go to Dev-Bug-Coder-Blog Home Page
      </Link>
    </div>
  );
}
