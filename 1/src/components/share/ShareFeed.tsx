"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PenLine, Bookmark } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { subscribeShares } from "@/lib/shares";
import type { SharePost } from "@/types/share";
import BookLoading from "@/components/ui/BookLoading";
import ShareWriteModal from "./ShareWriteModal";
import SharePostCard from "./SharePostCard";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import GuestRestrictedHint from "@/components/ui/GuestRestrictedHint";

export default function ShareFeed() {
  const { playerId, isGuest } = useAuth();
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedKey, setFeedKey] = useState(0);
  const [writeOpen, setWriteOpen] = useState(false);
  const feedRef = useGsapReveal<HTMLDivElement>("stagger", [posts.length, loading]);

  useEffect(() => {
    const unsub = subscribeShares((p) => {
      setPosts(p);
      setLoading(false);
    });
    return unsub;
  }, [feedKey]);

  return (
    <div ref={feedRef} className="mx-auto max-w-xl space-y-3 p-1">
      {isGuest && (
        <div data-reveal-item className="rounded-xl bg-amber-500/10 px-3 py-2">
          <GuestRestrictedHint action="tim và bình luận bài viết" />
        </div>
      )}

      <div data-reveal-item className="glass-panel flex items-center justify-between !py-3">
        <div>
          <h1 className="text-base font-bold text-stone-900 dark:text-white">
            Bảng tin
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Bài nhiều tim được ưu tiên
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/share/saved"
            className="btn-secondary flex items-center gap-1.5 !px-3 !py-2 text-xs"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Đã lưu
          </Link>
          <button
            type="button"
            onClick={() => setWriteOpen(true)}
            className="btn-primary flex items-center gap-1.5 !px-3 !py-2 text-xs"
          >
            <PenLine className="h-3.5 w-3.5" />
            Viết bài
          </button>
        </div>
      </div>

      <ShareWriteModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onPosted={() => setFeedKey((k) => k + 1)}
      />

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <BookLoading label="Đang tải bài chia sẻ..." />
        </div>
      ) : posts.length === 0 ? (
        <div data-reveal-item className="glass-panel text-center text-sm text-stone-500">
          Chưa có bài nào. Bấm <strong>Viết bài</strong> để đăng bài đầu tiên!
        </div>
      ) : (
        posts.map((post) => (
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
