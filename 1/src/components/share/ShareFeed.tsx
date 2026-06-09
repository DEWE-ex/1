"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, Send, Trophy } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  subscribeShares,
  toggleLike,
  hasLiked,
  subscribeComments,
  addComment,
} from "@/lib/shares";
import { getAchievementById } from "@/lib/reading";
import type { ShareComment, SharePost } from "@/types/share";
import BookLoading from "@/components/ui/BookLoading";
import ShareWritePanel from "./ShareWritePanel";

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
        📚 Phiên đọc
      </span>
    );
  }
  return null;
}

function SharePostCard({
  post,
  userId,
}: {
  post: SharePost;
  userId: string;
}) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ShareComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { displayName, photoURL } = useAuth();

  useEffect(() => {
    hasLiked(post.id, userId).then(setLiked);
  }, [post.id, userId, post.likeCount]);

  useEffect(() => {
    if (!showComments) return;
    return subscribeComments(post.id, setComments);
  }, [post.id, showComments]);

  const handleLike = async () => {
    const nowLiked = await toggleLike(post.id, userId);
    setLiked(nowLiked);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
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

  return (
    <article className="animate-slide-up glass-panel">
      <div className="flex items-center gap-3">
        {post.authorPhoto ? (
          <img
            src={post.authorPhoto}
            alt=""
            className="h-10 w-10 rounded-full ring-2 ring-white/50"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-rose-400 text-sm font-bold text-white">
            {post.authorName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-800 dark:text-slate-100">
            {post.authorName}
          </p>
          <p className="text-xs text-stone-400">
            {new Date(post.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <PostTypeBadge post={post} />
      </div>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="mt-4 max-h-80 w-full rounded-xl object-cover"
        />
      )}

      {post.bookTitle && (
        <p className="mt-3 text-sm font-bold text-warm-600 dark:text-cold-300">
          📖 {post.bookTitle}
        </p>
      )}

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-slate-200">
        {post.content}
      </p>

      <div className="mt-4 flex items-center gap-4 border-t border-white/20 pt-3 dark:border-cold-border">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition ${
            liked ? "text-rose-500" : "text-stone-500 hover:text-rose-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {post.likeCount}
        </button>
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-medium text-stone-500 transition hover:text-violet-500"
        >
          <MessageCircle className="h-4 w-4" />
          {post.commentCount}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 space-y-3 border-t border-white/20 pt-3 dark:border-cold-border">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 text-sm">
              <span className="font-semibold text-stone-700 dark:text-slate-200">
                {c.authorName}:
              </span>
              <span className="text-stone-600 dark:text-slate-300">
                {c.content}
              </span>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Viết bình luận..."
              className="input-field flex-1 !py-2 text-sm"
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary !px-3 !py-2"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default function ShareFeed() {
  const { playerId } = useAuth();
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedKey, setFeedKey] = useState(0);

  useEffect(() => {
    const unsub = subscribeShares((p) => {
      setPosts(p);
      setLoading(false);
    });
    return unsub;
  }, [feedKey]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-1">
      <ShareWritePanel onPosted={() => setFeedKey((k) => k + 1)} />

      <div className="glass-panel !py-4">
        <h1 className="text-lg font-bold text-stone-900 dark:text-white">
          Bảng tin
        </h1>
        <p className="text-sm text-stone-500 dark:text-slate-400">
          Bài nhiều tim được ưu tiên lên đầu
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <BookLoading label="Đang tải bài chia sẻ..." />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel text-center text-stone-500">
          Chưa có bài nào. Hãy viết bài đầu tiên ở trên!
        </div>
      ) : (
        posts.map((post) => (
          <SharePostCard key={post.id} post={post} userId={playerId!} />
        ))
      )}
    </div>
  );
}
