"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Flag,
  X,
  Calendar,
  BookOpen,
  Trophy,
  ZoomIn,
  Download,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  addComment,
  hasLiked,
  hasReportedPost,
  reportSharePost,
  subscribeComments,
  toggleLike,
} from "@/lib/shares";
import { hasSavedPost, toggleSavePost } from "@/lib/savedPosts";
import { getAchievementById } from "@/lib/reading";
import { extractTitleAndExcerpt } from "@/lib/share-format";
import type { ShareComment, SharePost } from "@/types/share";
import ReportPostModal from "./ReportPostModal";
import GuestRestrictedHint from "@/components/ui/GuestRestrictedHint";

interface SharePostDetailModalProps {
  post: SharePost | null;
  onClose: () => void;
}

/**
 * Modal đọc toàn bộ bài viết.
 * - Mount ngay khi `post` được truyền vào, animation GSAP phụ trách open/close.
 * - Khi đóng: chạy animation GSAP rồi mới gọi `onClose()` (parent set post=null).
 * - Tất cả tương tác like / save / report / comment nằm trong modal này.
 */
export default function SharePostDetailModal({
  post,
  onClose,
}: SharePostDetailModalProps) {
  const { playerId, isGuest, displayName, photoURL } = useAuth();

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [comments, setComments] = useState<ShareComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Vòng đời: giữ modal mount để chạy animation đóng trước khi unmount
  const [displayPost, setDisplayPost] = useState<SharePost | null>(post);
  const [mounted, setMounted] = useState(!!post);
  const closingRef = useRef(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Đồng bộ post prop → displayPost + mounted
  useEffect(() => {
    if (post) {
      // Đang trong quá trình đóng mà có post mới → huỷ đóng
      closingRef.current = false;
      setDisplayPost(post);
      setMounted(true);
    } else if (displayPost && !closingRef.current) {
      // Đóng modal: chạy animation GSAP, sau đó mới unmount
      closingRef.current = true;
      playCloseAnimation(() => {
        setMounted(false);
        setDisplayPost(null);
        closingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  // Animation mở — chạy mỗi khi `mounted` chuyển từ false → true (post mới)
  useGSAP(
    () => {
      if (!mounted || !backdropRef.current || !panelRef.current) return;
      playOpenAnimation(backdropRef.current, panelRef.current);
    },
    { dependencies: [mounted] }
  );

  // Khoá scroll + Escape khi modal đang hiển thị
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxOpen) setLightboxOpen(false);
        else handleClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, lightboxOpen]);

  // Reset tương tác khi đổi post
  useEffect(() => {
    if (!displayPost) return;
    setLiked(false);
    setSaved(false);
    setReported(false);
    setCommentText("");
    setLightboxOpen(false);
    if (!playerId) return;
    hasLiked(displayPost.id, playerId).then(setLiked);
    hasSavedPost(displayPost.id, playerId).then(setSaved);
    hasReportedPost(displayPost.id, playerId).then(setReported);
  }, [displayPost, playerId]);

  // Subscribe comments
  useEffect(() => {
    if (!displayPost) return;
    const unsub = subscribeComments(displayPost.id, setComments);
    return unsub;
  }, [displayPost]);

  function handleClose() {
    if (!displayPost || closingRef.current) return;
    onClose(); // parent set post=null → useEffect sẽ chạy playCloseAnimation
  }

  if (!mounted || !displayPost || typeof document === "undefined") return null;

  const { title } = extractTitleAndExcerpt(
    displayPost.content,
    displayPost.bookTitle
  );

  const handleLike = async () => {
    if (isGuest || !playerId) return;
    const nowLiked = await toggleLike(displayPost.id, playerId);
    setLiked(nowLiked);
    displayPost.likeCount += nowLiked ? 1 : -1;
    setDisplayPost({ ...displayPost });
  };

  const handleSave = async () => {
    if (!playerId) return;
    try {
      const nowSaved = await toggleSavePost(displayPost.id, playerId);
      setSaved(nowSaved);
    } catch (err) {
      console.error("Save post error:", err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !playerId || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(
        displayPost.id,
        playerId,
        displayName,
        photoURL ?? undefined,
        commentText
      );
      setCommentText("");
      displayPost.commentCount += 1;
      setDisplayPost({ ...displayPost });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (reason: string) => {
    if (!playerId) return;
    await reportSharePost(
      displayPost.id,
      playerId,
      displayName,
      reason,
      displayPost
    );
    setReported(true);
  };

  const dateLabel = new Date(displayPost.createdAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const PostTypeBadge = (() => {
    if (displayPost.postType === "achievement") {
      const ach = displayPost.achievementId
        ? getAchievementById(displayPost.achievementId)
        : null;
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
          <Trophy className="h-3 w-3" />
          {ach ? `Thành tựu: ${ach.name}` : "Thành tựu"}
        </span>
      );
    }
    if (displayPost.postType === "reading") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
          <BookOpen className="h-3 w-3" />
          Phiên đọc
        </span>
      );
    }
    return null;
  })();

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        ref={backdropRef}
        className="share-modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-labelledby="share-post-detail-title"
        className="share-modal-panel glass-strong relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl shadow-glass sm:rounded-2xl"
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/30 bg-white/70 px-4 py-3 backdrop-blur-md dark:border-cold-border dark:bg-cold-800/70">
          <h2
            id="share-post-detail-title"
            className="flex-1 truncate text-sm font-bold text-stone-900 dark:text-white"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-stone-500 transition hover:bg-white/60 dark:hover:bg-cold-700/60"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {displayPost.authorPhoto ? (
              <img
                src={displayPost.authorPhoto}
                alt=""
                className="h-10 w-10 rounded-full ring-2 ring-white/50"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-rose-400 text-sm font-bold text-white">
                {(displayPost.authorName ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-800 dark:text-slate-100">
                {displayPost.authorName}
              </p>
              <p className="flex items-center gap-1 text-[10px] text-stone-400">
                <Calendar className="h-2.5 w-2.5" /> {dateLabel}
              </p>
            </div>
            {PostTypeBadge}
          </div>

          {displayPost.bookTitle && (
            <p className="mt-3 flex items-center gap-1.5 text-base font-bold text-warm-600 dark:text-cold-300">
              <BookOpen className="h-4 w-4" /> {displayPost.bookTitle}
            </p>
          )}

          {displayPost.imageUrl && (
            <PostImage
              src={displayPost.imageUrl}
              alt={title}
              onOpen={() => setLightboxOpen(true)}
            />
          )}

          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-slate-200">
            {displayPost.content}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/30 bg-white/40 backdrop-blur-md dark:border-cold-border dark:bg-cold-800/40">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2">
            <button
              type="button"
              onClick={handleLike}
              disabled={isGuest}
              title={isGuest ? "Đăng nhập Google để tim bài" : undefined}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                liked
                  ? "bg-rose-500/15 text-rose-500"
                  : "text-stone-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-cold-700/60"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {displayPost.likeCount} Tim
            </button>
            <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-slate-300">
              <MessageCircle className="h-4 w-4" />
              {displayPost.commentCount} Bình luận
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={!playerId}
              title={saved ? "Bỏ lưu" : "Lưu bài"}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                saved
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                  : "text-stone-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-cold-700/60"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Đã lưu" : "Lưu"}
            </button>
            {!isGuest && displayPost.authorId !== playerId && (
              <button
                type="button"
                onClick={() => !reported && setShowReport(true)}
                disabled={reported}
                className={`ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  reported
                    ? "text-stone-400"
                    : "text-stone-500 hover:bg-white/60 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-cold-700/60"
                }`}
              >
                <Flag className="h-4 w-4" />
                {reported ? "Đã báo cáo" : "Báo cáo"}
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto border-t border-white/30 px-4 py-2 dark:border-cold-border">
            {comments.length === 0 ? (
              <p className="py-3 text-center text-xs text-stone-400">
                Chưa có bình luận nào.
              </p>
            ) : (
              <ul className="space-y-2 py-1">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-2 text-xs">
                    <span className="shrink-0 font-semibold text-stone-700 dark:text-slate-200">
                      {c.authorName}:
                    </span>
                    <span className="text-stone-600 dark:text-slate-300">
                      {c.content}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {isGuest ? (
              <div className="pt-2">
                <GuestRestrictedHint action="bình luận" />
              </div>
            ) : (
              <form onSubmit={handleComment} className="flex gap-2 py-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Bình luận..."
                  className="input-field flex-1 !py-1.5 text-xs"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="btn-primary !px-2.5 !py-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <ReportPostModal
        open={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={handleReport}
      />

      <ImageLightbox
        src={displayPost.imageUrl ?? null}
        alt={title}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>,
    document.body
  );
}

/* ---------- Animation helpers ---------- */

function playOpenAnimation(backdrop: HTMLElement, panel: HTMLElement) {
  const tl = gsap.timeline();
  tl.fromTo(
    backdrop,
    { opacity: 0, backdropFilter: "blur(0px)" },
    { opacity: 1, backdropFilter: "blur(4px)", duration: 0.22, ease: "power2.out" }
  ).fromTo(
    panel,
    { opacity: 0, scale: 0.86, y: 40, rotateX: 6 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      rotateX: 0,
      duration: 0.42,
      ease: "back.out(1.4)",
    },
    "-=0.12"
  );
  return tl;
}

function playCloseAnimation(onComplete: () => void) {
  const tl = gsap.timeline({ onComplete });
  tl.to(".share-modal-panel", {
    opacity: 0,
    scale: 0.94,
    y: 16,
    duration: 0.22,
    ease: "power2.in",
  }).to(
    ".share-modal-backdrop",
    { opacity: 0, backdropFilter: "blur(0px)", duration: 0.18 },
    "-=0.1"
  );
}

/* ---------- Sub components ---------- */

function PostImage({
  src,
  alt,
  onOpen,
}: {
  src: string;
  alt: string;
  onOpen: () => void;
}) {
  const wrapRef = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;

    const evaluate = () => {
      const frameW = wrap.clientWidth;
      const frameH = wrap.clientHeight;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      if (!naturalW || !naturalH || !frameW || !frameH) {
        setShowHint(false);
        return;
      }
      const frameRatio = frameW / frameH;
      const imgRatio = naturalW / naturalH;
      let displayedW: number;
      let displayedH: number;
      if (imgRatio > frameRatio) {
        displayedW = frameW;
        displayedH = frameW / imgRatio;
      } else {
        displayedH = frameH;
        displayedW = frameH * imgRatio;
      }
      const ratioW = displayedW / naturalW;
      const ratioH = displayedH / naturalH;
      const isUpscaled = ratioW > 1.05 || ratioH > 1.05;
      const isTooSmall =
        displayedW < frameW * 0.6 || displayedH < frameH * 0.6;
      setShowHint(isUpscaled || isTooSmall);
    };

    if (img.complete) evaluate();
    img.addEventListener("load", evaluate);
    window.addEventListener("resize", evaluate);
    return () => {
      img.removeEventListener("load", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, [src]);

  return (
    <button
      ref={wrapRef}
      type="button"
      onClick={onOpen}
      title="Bấm để xem ảnh gốc"
      className="group relative mt-3 block w-full overflow-hidden rounded-xl bg-stone-100/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 hover:bg-stone-100/80 dark:bg-cold-800/40 dark:hover:bg-cold-800/60"
      style={{ minHeight: "120px" }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="mx-auto block max-h-[60vh] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        draggable={false}
      />
      {showHint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md backdrop-blur-sm transition group-hover:scale-105 group-hover:bg-black/80">
            <ZoomIn className="h-3 w-3" />
            Xem ảnh gốc
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/30 p-1.5 opacity-0 transition group-hover:opacity-100">
        <ZoomIn className="h-3.5 w-3.5 text-white" />
      </div>
    </button>
  );
}

/**
 * Lightbox xem ảnh gốc. Animation GSAP: zoom-in + fade cho ảnh,
 * fade cho backdrop. Click vào ảnh hoặc backdrop / Esc / nút X để đóng.
 */
function ImageLightbox({
  src,
  alt,
  open,
  onClose,
}: {
  src: string | null;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    closingRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useGSAP(
    () => {
      const backdrop = backdropRef.current;
      const img = imgRef.current;
      if (!backdrop || !img) return;
      if (open) {
        // Open: zoom-in + fade
        const tl = gsap.timeline();
        tl.fromTo(
          backdrop,
          { opacity: 0 },
          { opacity: 1, duration: 0.2, ease: "power2.out" }
        ).fromTo(
          img,
          { opacity: 0, scale: 0.5, rotateY: 12, filter: "blur(8px)" },
          {
            opacity: 1,
            scale: 1,
            rotateY: 0,
            filter: "blur(0px)",
            duration: 0.45,
            ease: "back.out(1.6)",
          },
          "-=0.08"
        );
      }
    },
    { dependencies: [open, src] }
  );

  function handleClose() {
    if (closingRef.current || !backdropRef.current || !imgRef.current) {
      onClose();
      return;
    }
    closingRef.current = true;
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(imgRef.current, {
      opacity: 0,
      scale: 0.6,
      rotateY: -8,
      filter: "blur(6px)",
      duration: 0.25,
      ease: "power2.in",
    }).to(
      backdropRef.current,
      { opacity: 0, duration: 0.18 },
      "-=0.1"
    );
  }

  if (!open || !src || typeof document === "undefined") return null;

  const handleDownload = () => {
    try {
      const a = document.createElement("a");
      a.href = src;
      a.download = `bookfinder-share-${Date.now()}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Download image error:", err);
    }
  };

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal
      aria-label="Xem ảnh gốc"
    >
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          aria-label="Tải ảnh xuống"
          title="Tải ảnh xuống"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          aria-label="Đóng"
          title="Đóng (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[92vw] cursor-zoom-out select-none rounded-lg object-contain shadow-2xl"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        draggable={false}
      />
    </div>,
    document.body
  );
}