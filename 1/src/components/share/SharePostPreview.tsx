"use client";

import { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  Calendar,
  BookOpen,
  Trophy,
  Sparkles,
  Flag,
} from "lucide-react";
import type { SharePost } from "@/types/share";
import { extractTitleAndExcerpt } from "@/lib/share-format";
import { getAchievementById } from "@/lib/reading";
import { hasReportedPost, reportSharePost } from "@/lib/shares";
import { useAuth } from "@/components/providers/AuthProvider";
import ReportPostModal from "./ReportPostModal";
import { cn } from "@/lib/cn";

/**
 * Card hiển thị rút gọn của một bài chia sẻ: tiêu đề + excerpt.
 * - Click vào card → mở modal đọc toàn bộ bài.
 * - Nút Flag ở góc → mở popup báo cáo (không mở modal bài).
 * - Wrapper là `<div role="button">` thay vì `<button>` để có thể chứa nút con
 *   (the Flag báo cáo).
 */
export default function SharePostPreview({
  post,
  variant = "default",
  onOpen,
}: {
  post: SharePost;
  variant?: "default" | "today" | "allTime" | "week" | "month";
  onOpen: (post: SharePost) => void;
}) {
  const { playerId, displayName, isGuest } = useAuth();
  const [reported, setReported] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Check xem user đã báo cáo bài này chưa
  useEffect(() => {
    if (!playerId || isGuest) return;
    let cancelled = false;
    hasReportedPost(post.id, playerId).then((v) => {
      if (!cancelled) setReported(v);
    });
    return () => {
      cancelled = true;
    };
  }, [post.id, playerId, isGuest]);

  const handleOpen = () => {
    if (showReport) return; // đang mở report → không mở modal bài
    onOpen(post);
  };

  const handleReportClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (reported) return;
    setShowReport(true);
  };

  const handleReportSubmit = async (reason: string) => {
    if (!playerId) return;
    await reportSharePost(post.id, playerId, displayName, reason, post);
    setReported(true);
  };

  const { title, excerpt } = extractTitleAndExcerpt(
    post.content,
    post.bookTitle
  );

  const authorInitial = (post.authorName ?? "?").charAt(0).toUpperCase();
  const dateLabel = new Date(post.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const canReport = !isGuest && !!playerId && post.authorId !== playerId;

  const PostTypeBadge = (() => {
    if (post.postType === "achievement") {
      const ach = post.achievementId
        ? getAchievementById(post.achievementId)
        : null;
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
          <Trophy className="h-3 w-3" />
          {ach ? `Thành tựu: ${ach.name}` : "Thành tựu"}
        </span>
      );
    }
    if (post.postType === "reading") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-800 dark:text-violet-200">
          <BookOpen className="h-3 w-3" />
          Phiên đọc
        </span>
      );
    }
    return null;
  })();

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
        data-reveal-item
        aria-label={`Mở bài viết: ${title}`}
        className={cn(
          "group relative block h-full w-full cursor-pointer overflow-hidden rounded-2xl text-left transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          "active:scale-[0.99]",
          variantClass(variant)
        )}
      >
        {/* Lớp overlay cho featured card */}
        {variant !== "default" && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
        )}

        {/* Ribbon (top-right, chỉ featured cards) */}
        {variant !== "default" && (
          <div className="pointer-events-none absolute right-3 top-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {variant === "today" && (
                <>
                  <Sparkles className="h-3 w-3" /> Hôm nay
                </>
              )}
              {variant === "allTime" && (
                <>
                  <Sparkles className="h-3 w-3" /> Toàn thời gian
                </>
              )}
              {variant === "week" && (
                <>
                  <Sparkles className="h-3 w-3" /> Tuần này
                </>
              )}
              {variant === "month" && (
                <>
                  <Sparkles className="h-3 w-3" /> Tháng này
                </>
              )}
            </span>
          </div>
        )}

        <div
          className={cn(
            "relative z-[1] flex h-full flex-col p-4",
            variant !== "default" && "text-white"
          )}
        >
          {/* Author */}
          <div className="flex items-center gap-2">
            {post.authorPhoto ? (
              <img
                src={post.authorPhoto}
                alt=""
                className="h-7 w-7 rounded-full ring-2 ring-white/40"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/30 text-xs font-bold backdrop-blur-sm">
                {authorInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {post.authorName}
              </p>
              <p
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  variant !== "default"
                    ? "text-white/80"
                    : "text-stone-400"
                )}
              >
                <Calendar className="h-2.5 w-2.5" /> {dateLabel}
              </p>
            </div>
            {PostTypeBadge && variant === "default" && (
              <div className="shrink-0">{PostTypeBadge}</div>
            )}
          </div>

          {/* Title */}
          <h3
            className={cn(
              "mt-3 font-bold leading-tight",
              variant === "today"
                ? "text-2xl sm:text-3xl"
                : variant !== "default"
                  ? "text-xl"
                  : "text-base"
            )}
          >
            {title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p
              className={cn(
                "mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed",
                variant !== "default"
                  ? "text-white/90"
                  : "text-stone-600 dark:text-slate-300"
              )}
            >
              {excerpt}
            </p>
          )}

          {/* Footer: stats */}
          <div
            className={cn(
              "mt-auto flex items-center gap-3 pt-3 text-xs",
              variant !== "default"
                ? "text-white/90"
                : "text-stone-500 dark:text-slate-400"
            )}
          >
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {post.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> {post.commentCount}
            </span>

            {/* Nút báo cáo — cùng hàng với tim / comment */}
            {canReport && (
              <button
                type="button"
                onClick={handleReportClick}
                disabled={reported}
                aria-label={
                  reported ? "Đã báo cáo bài viết" : "Báo cáo bài viết"
                }
                title={reported ? "Đã báo cáo" : "Báo cáo bài viết"}
                className={cn(
                  "ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition active:scale-95",
                  variant === "default"
                    ? reported
                      ? "cursor-not-allowed text-stone-400 dark:text-slate-500"
                      : "text-stone-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                    : reported
                      ? "cursor-not-allowed text-white/50"
                      : "text-white/90 hover:bg-white/15 hover:text-white"
                )}
              >
                <Flag className="h-3.5 w-3.5" />
                <span>{reported ? "Đã báo cáo" : "Báo cáo"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Popup báo cáo — render cùng cấp với card, không bị modal bài che */}
      <ReportPostModal
        open={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={handleReportSubmit}
      />
    </>
  );
}

function variantClass(
  variant: "default" | "today" | "allTime" | "week" | "month"
) {
  switch (variant) {
    case "today":
      // Đỏ - bài nổi bật trong ngày
      return "bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 shadow-lg hover:shadow-xl";
    case "allTime":
      // Cyan - toàn thời gian
      return "bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-500 shadow-lg hover:shadow-xl";
    case "week":
      // Xanh lá - tuần
      return "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 shadow-lg hover:shadow-xl";
    case "month":
      // Vàng - tháng
      return "bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400 shadow-lg hover:shadow-xl";
    default:
      // Trắng - glassmorphism + neumorphism
      return cn("glass-neu", "text-stone-800 dark:text-slate-100");
  }
}