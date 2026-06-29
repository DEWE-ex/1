"use client";

import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  /** Áp dụng hiệu ứng shimmer (mặc định bật) */
  shimmer?: boolean;
}

/**
 * Khối skeleton dùng khi đang tải dữ liệu.
 * - Có hiệu ứng shimmer (gradient chạy ngang) để gợi cảm giác "đang tải".
 * - Dùng glass-neu để đồng bộ phong cách với card thật.
 */
export function Skeleton({ className, shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-stone-200/70 dark:bg-cold-700/60",
        shimmer && "shimmer",
        className
      )}
      aria-hidden
    />
  );
}

/** Skeleton giả lập một bài viết (preview card) */
export function SkeletonPostPreview() {
  return (
    <div className="glass-neu flex h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-11/12" />
      <div className="mt-auto flex gap-3 pt-2">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

/** Skeleton giả lập khung "nổi bật" lớn (ô đỏ/cyan/xanh/vàng) */
export function SkeletonFeatured({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={cn(
        "glass-neu flex h-full flex-col gap-3 p-4",
        tall ? "min-h-[260px]" : "min-h-[120px]"
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <Skeleton className={cn("w-3/4", tall ? "h-7" : "h-5")} />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      {tall && <Skeleton className="h-3 w-4/6" />}
    </div>
  );
}

/**
 * Skeleton grid khớp với layout MagazineFeed của ShareFeed.
 * Dùng để hiển thị trong khi đang tải bài viết.
 */
export function SkeletonFeed() {
  return (
    <div className="space-y-3">
      {/* Hàng trên: 1 ô lớn + 2 ô nhỏ */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SkeletonFeatured tall />
        <div className="flex flex-col gap-3">
          <SkeletonFeatured />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SkeletonFeatured />
            <SkeletonFeatured />
          </div>
        </div>
      </div>

      {/* Hàng dưới: 3 ô ngang */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-3 w-24" />
        <SkeletonPostPreview />
        <SkeletonPostPreview />
        <SkeletonPostPreview />
      </div>
    </div>
  );
}