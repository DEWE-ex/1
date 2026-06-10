"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Heart } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { subscribeShares } from "@/lib/shares";
import { subscribeSavedPostIds } from "@/lib/savedPosts";
import type { SharePost } from "@/types/share";
import SharePostCard from "./SharePostCard";
import BookLoading from "@/components/ui/BookLoading";
import { useGsapReveal } from "@/hooks/useGsapReveal";

export default function SavedPostsFeed() {
  const { playerId, isGuest } = useAuth();
  const [allPosts, setAllPosts] = useState<SharePost[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const savedPosts = useMemo(
    () =>
      savedIds
        .map((id) => allPosts.find((p) => p.id === id))
        .filter((p): p is SharePost => !!p),
    [savedIds, allPosts]
  );

  const feedRef = useGsapReveal<HTMLDivElement>("stagger", [
    savedPosts.length,
    loadingPosts,
    loadingSaved,
  ]);

  useEffect(() => {
    const unsub = subscribeShares((posts) => {
      setAllPosts(posts);
      setLoadingPosts(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!playerId) return;
    const unsub = subscribeSavedPostIds(playerId, (ids) => {
      setSavedIds(ids);
      setLoadingSaved(false);
    });
    return unsub;
  }, [playerId]);

  const loading = loadingPosts || loadingSaved;

  return (
    <div ref={feedRef} className="mx-auto max-w-xl space-y-3 p-1">
      <div data-reveal-item className="glass-panel flex items-center justify-between !py-3">
        <div>
          <h1 className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-white">
            <Bookmark className="h-4 w-4 text-amber-500" />
            Bài đã lưu
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            {savedIds.length} bài trong bộ sưu tập của bạn
          </p>
        </div>
        <Link
          href="/share"
          className="btn-secondary flex items-center gap-1.5 !px-3 !py-2 text-xs"
        >
          <Heart className="h-3.5 w-3.5" />
          Bảng tin
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <BookLoading label="Đang tải bài đã lưu..." />
        </div>
      ) : savedIds.length === 0 ? (
        <div data-reveal-item className="glass-panel text-center text-sm text-stone-500">
          Chưa lưu bài nào. Vào{" "}
          <Link href="/share" className="font-semibold text-violet-600 underline">
            bảng tin
          </Link>{" "}
          và bấm <strong>Lưu</strong> trên bài bạn thích!
        </div>
      ) : savedPosts.length === 0 ? (
        <div data-reveal-item className="glass-panel text-center text-sm text-stone-500">
          Các bài đã lưu không còn trên bảng tin hoặc đã bị xóa.
        </div>
      ) : (
        savedPosts.map((post) => (
          <SharePostCard
            key={post.id}
            post={post}
            userId={playerId!}
            isGuest={isGuest}
          />
        ))
      )}
    </div>
  );
}
