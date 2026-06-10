"use client";

import { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Trophy,
  BookOpen,
  Flag,
  Bookmark,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  toggleLike,
  hasLiked,
  subscribeComments,
  addComment,
  reportSharePost,
  hasReportedPost,
} from "@/lib/shares";
import { toggleSavePost, hasSavedPost } from "@/lib/savedPosts";
import { getAchievementById } from "@/lib/reading";
import type { ShareComment, SharePost } from "@/types/share";
import ReportPostModal from "./ReportPostModal";
import GuestRestrictedHint from "@/components/ui/GuestRestrictedHint";

function PostTypeBadge({ post }: { post: SharePost }) {
  if (post.postType === "achievement") {
    const ach = post.achievementId
      ? getAchievementById(post.achievementId)
      : null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
        <Trophy className="h-3 w-3" />
        {ach ? `Thành tựu: ${ach.name}` : "Thành tựu"}
      </span>
    );
  }
  if (post.postType === "reading") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
        <BookOpen className="h-3 w-3" />
        Phiên đọc
      </span>
    );
  }
  return null;
}

export default function SharePostCard({
  post,
  userId,
  isGuest,
  showSave = true,
}: {
  post: SharePost;
  userId: string;
  isGuest: boolean;
  showSave?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [comments, setComments] = useState<ShareComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { displayName, photoURL } = useAuth();

  useEffect(() => {
    hasLiked(post.id, userId).then(setLiked);
    hasReportedPost(post.id, userId).then(setReported);
    if (showSave) hasSavedPost(post.id, userId).then(setSaved);
  }, [post.id, userId, post.likeCount, showSave]);

  useEffect(() => {
    if (!showComments) return;
    return subscribeComments(post.id, setComments);
  }, [post.id, showComments]);

  const handleLike = async () => {
    if (isGuest) return;
    const nowLiked = await toggleLike(post.id, userId);
    setLiked(nowLiked);
  };

  const handleSave = async () => {
    try {
      const nowSaved = await toggleSavePost(post.id, userId);
      setSaved(nowSaved);
    } catch (err) {
      console.error("Save post error:", err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(
        post.id,
        userId,
        displayName,
        photoURL ?? undefined,
        commentText
      );
      setCommentText("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (reason: string) => {
    await reportSharePost(post.id, userId, displayName, reason, post);
    setReported(true);
  };

  return (
    <>
      <article data-reveal-item className="glass-panel">
        <div className="flex items-center gap-3">
          {post.authorPhoto ? (
            <img
              src={post.authorPhoto}
              alt=""
              className="h-9 w-9 rounded-full ring-2 ring-white/50"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-rose-400 text-sm font-bold text-white">
              {post.authorName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-800 dark:text-slate-100">
              {post.authorName}
            </p>
            <p className="text-[10px] text-stone-400">
              {new Date(post.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
          <PostTypeBadge post={post} />
        </div>

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt=""
            className="mt-3 max-h-64 w-full rounded-xl object-cover"
          />
        )}

        {post.bookTitle && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-warm-600 dark:text-cold-300">
            <BookOpen className="h-3.5 w-3.5" /> {post.bookTitle}
          </p>
        )}

        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-slate-200">
          {post.content}
        </p>

        <div className="mt-3 flex items-center gap-3 border-t border-white/20 pt-2.5 dark:border-cold-border">
          <button
            type="button"
            onClick={handleLike}
            disabled={isGuest}
            title={isGuest ? "Đăng nhập Google để tim bài" : undefined}
            className={`flex items-center gap-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${liked ? "text-rose-500" : "text-stone-500 hover:text-rose-500"
              }`}
          >
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
            {post.likeCount}
          </button>
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-xs font-medium text-stone-500 transition hover:text-violet-500"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount}
          </button>
          {showSave && (
            <button
              type="button"
              onClick={handleSave}
              title={saved ? "Bỏ lưu" : "Lưu bài"}
              className={`flex items-center gap-1 text-xs font-medium transition ${saved
                  ? "text-amber-500"
                  : "text-stone-500 hover:text-amber-500"
                }`}
            >

              <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-current" : ""}`} />
              {saved ? "Đã lưu" : "Lưu"}
            </button>
          )}
          {!isGuest && post.authorId !== userId && (
            <button
              type="button"
              onClick={() => !reported && setShowReport(true)}
              disabled={reported}
              className={`ml-auto flex items-center gap-1 text-xs font-medium transition ${reported
                  ? "text-stone-400"
                  : "text-stone-500 hover:text-amber-600"
                }`}
            >
              <Flag className="h-3.5 w-3.5" />
              {reported ? "Đã báo cáo" : "Báo cáo"}
            </button>
          )}
        </div>

        {showComments && (
          <div className="mt-3 space-y-2 border-t border-white/20 pt-2.5 dark:border-cold-border">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-xs">
                <span className="font-semibold text-stone-700 dark:text-slate-200">
                  {c.authorName}:
                </span>
                <span className="text-stone-600 dark:text-slate-300">
                  {c.content}
                </span>
              </div>
            ))}
            {isGuest ? (
              <GuestRestrictedHint action="bình luận" />
            ) : (
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Bình luận..."
                  className="input-field flex-1 !py-1.5 text-xs"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary !px-2.5 !py-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        )}
      </article>

      <ReportPostModal
        open={showReport}
        onClose={() => setShowReport(false)}
        onSubmit={handleReport}
      />
    </>
  );
}
