"use client";

import React from "react";
import Link from "next/link";

interface PostLoginPromptProps {
  onClose: () => void;
}

const PostLoginPrompt: React.FC<PostLoginPromptProps> = ({ onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-12 rounded-lg shadow-xl max-w-sm w-full mx-4">
      <h3 className="text-md font-courier text-pretty font-semibold mb-8">
        Sign in required!
      </h3>
      <p className="text-gray-600 text-sm font-courier text-pretty mb-8">
        Please{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          sign in
        </Link>{" "}
        to interact with posts and join the discussion.
      </p>
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-lg font-courier text-pretty rounded-lg hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default PostLoginPrompt;
