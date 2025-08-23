import React from "react";

const LoadingSpinner: React.FC<{ text?: string }> = ({
  text = "Processing...",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-30">
      <div className="flex flex-col items-center">
        <span className="relative flex h-16 w-16 mb-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-16 w-16 bg-blue-500"></span>
        </span>
        <span className="text-lg font-bold text-blue-700 animate-pulse">
          {text}
        </span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
