/**
 * Skeleton Component - Loading Placeholder
 * Provides smooth loading states without layout shift
 */

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional width override (e.g., "200px", "50%")
   */
  width?: string;
  /**
   * Optional height override (e.g., "100px", "2rem")
   */
  height?: string;
}

/**
 * Base skeleton component for loading states
 * Animates with pulse effect to indicate loading
 */
function Skeleton({
  className,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

/**
 * Post card skeleton with exact dimensions matching PostCard structure
 * Prevents layout shift during loading - matches p-8 padding and content structure
 * Matches: PostHeader (w-12 h-12 avatar), PostContent (mt-8, text-2xl title), PostStats (mb-8), PostActionsBar (border-t border-b py-2)
 */
function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-8">
        {/* Header skeleton - matches PostHeader (w-12 h-12 avatar, space-x-3) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" /> {/* Avatar - matches w-12 h-12 */}
            <div>
              <Skeleton className="h-5 w-24 mb-2" /> {/* Author name - text-xl */}
              <Skeleton className="h-4 w-32" /> {/* Date - text-md */}
            </div>
          </div>
          <Skeleton className="h-9 w-9 rounded-full" /> {/* Dropdown button - p-2 */}
        </div>

        {/* Content skeleton - matches PostContent (mt-8) */}
        <div className="mt-8 space-y-4">
          <Skeleton className="h-8 w-3/4" /> {/* Title - text-2xl font-bold */}
          <Skeleton className="h-6 w-full" /> {/* Description line 1 - text-xl */}
          <Skeleton className="h-6 w-5/6" /> {/* Description line 2 */}
          <Skeleton className="h-6 w-4/5" /> {/* Description line 3 */}
          {/* Image skeleton - aspect-video (conditional, shown for consistency) */}
          <Skeleton className="w-full aspect-video rounded-lg" /> {/* Image - aspect-video */}
          {/* Tags skeleton - mb-12 */}
          <div className="flex flex-wrap gap-2 mb-12">
            <Skeleton className="h-7 w-20 rounded-full" /> {/* Tag 1 - text-md px-3 py-1 */}
            <Skeleton className="h-7 w-24 rounded-full" /> {/* Tag 2 */}
            <Skeleton className="h-7 w-18 rounded-full" /> {/* Tag 3 */}
          </div>
        </div>

        {/* Stats skeleton - matches PostStats (mb-8, justify-between) */}
        <div className="flex items-center justify-between text-lg mb-8">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-16" /> {/* Like count */}
            <Skeleton className="h-5 w-20" /> {/* Helpful count */}
          </div>
          <Skeleton className="h-5 w-20" /> {/* Comment count */}
        </div>

        {/* Actions skeleton - matches PostActionsBar (border-t border-b py-2, flex-1 buttons) */}
        <div className="flex items-center justify-between border-t border-b py-2">
          <Skeleton className="flex-1 h-10 mx-1 rounded-lg" /> {/* Like button - flex-1 */}
          <Skeleton className="flex-1 h-10 mx-1 rounded-lg" /> {/* Helpful button */}
          <Skeleton className="flex-1 h-10 mx-1 rounded-lg" /> {/* Comment button */}
          <Skeleton className="flex-1 h-10 mx-1 rounded-lg" /> {/* Share button */}
        </div>
      </div>
    </div>
  );
}

/**
 * Comment skeleton with exact dimensions
 */
function CommentSkeleton() {
  return (
    <div className="flex gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />{" "}
      {/* Avatar */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" /> {/* Username */}
        <Skeleton className="h-4 w-full" /> {/* Comment line 1 */}
        <Skeleton className="h-4 w-4/5" /> {/* Comment line 2 */}
        <div className="flex gap-4 mt-2">
          <Skeleton className="h-6 w-16" /> {/* Like */}
          <Skeleton className="h-6 w-16" /> {/* Reply */}
        </div>
      </div>
    </div>
  );
}

/**
 * Table row skeleton
 */
function TableRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
      <td className="p-4">
        <Skeleton className="h-8 w-20" />
      </td>
    </tr>
  );
}

/**
 * Badge skeleton
 */
function BadgeSkeleton() {
  return <Skeleton className="h-6 w-16 rounded-full" />;
}

/**
 * Button skeleton
 */
function ButtonSkeleton() {
  return <Skeleton className="h-10 w-24 rounded-md" />;
}

export {
  Skeleton,
  PostCardSkeleton,
  CommentSkeleton,
  TableRowSkeleton,
  BadgeSkeleton,
  ButtonSkeleton,
};
