"use client";

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";

interface BookLoadingProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function BookLoading({
  label = "Đang tải...",
  className,
  size = "md",
}: BookLoadingProps) {
  const iconSize =
    size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-8 w-8";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-warm-400/20 dark:bg-cold-400/20" />
        <div className="book-flip relative flex items-center justify-center rounded-2xl glass-strong p-4">
          <BookOpen
            className={cn(
              iconSize,
              "text-warm-500 dark:text-cold-400 book-flip-icon"
            )}
          />
        </div>
      </div>
      {label && (
        <p className="animate-pulse text-sm font-medium text-stone-500 dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  );
}
