"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
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
  const iconRef = useRef<HTMLDivElement>(null);
  const iconSize =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-7 w-7";
  const padSize = size === "sm" ? "p-2" : size === "lg" ? "p-4" : "p-3";

  useGSAP(
    () => {
      if (!iconRef.current) return;
      gsap.to(iconRef.current, {
        rotateY: 20,
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        transformPerspective: 400,
      });
    },
    { scope: iconRef }
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className
      )}
    >
      <div
        ref={iconRef}
        className={cn(
          "flex items-center justify-center rounded-xl glass-strong",
          padSize
        )}
      >
        <BookOpen
          className={cn(iconSize, "text-violet-500 dark:text-cold-400")}
        />
      </div>
      {label && (
        <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  );
}
