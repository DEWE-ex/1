"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  PenLine,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { subscribeShares } from "@/lib/shares";
import { subscribeSavedPostIds } from "@/lib/savedPosts";
import type { SharePost } from "@/types/share";
import BookLoading from "@/components/ui/BookLoading";
import { SkeletonFeed, SkeletonPostPreview } from "@/components/ui/Skeleton";
import ShareWriteModal from "./ShareWriteModal";
import SharePostPreview from "./SharePostPreview";
import SharePostDetailModal from "./SharePostDetailModal";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import GuestRestrictedHint from "@/components/ui/GuestRestrictedHint";
import { cn } from "@/lib/cn";

type FeedTab = "feed" | "saved";

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;
const ONE_MONTH = 30 * ONE_DAY;
const REST_PAGE_SIZE = 3;

export default function ShareFeed() {
  const { playerId, isGuest, authMode } = useAuth();
  const [tab, setTab] = useState<FeedTab>("feed");
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [writeOpen, setWriteOpen] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [activePost, setActivePost] = useState<SharePost | null>(null);
  const [restVisible, setRestVisible] = useState(REST_PAGE_SIZE);

  const now = Date.now();

  useEffect(() => {
    const unsub = subscribeShares((p) => {
      setPosts(p);
      setLoadingPosts(false);
    });
    return unsub;
  }, [feedKey]);

  useEffect(() => {
    if (!playerId) {
      setLoadingSaved(false);
      return;
    }
    const unsub = subscribeSavedPostIds(playerId, (ids) => {
      setSavedIds(ids);
      setLoadingSaved(false);
    });
    return unsub;
  }, [playerId]);

  // Reset phân trang khi đổi danh sách
  useEffect(() => {
    setRestVisible(REST_PAGE_SIZE);
  }, [posts.length, tab]);

  // Tính các bài nổi bật
  const featured = useMemo(() => {
    const sortedByLikes = [...posts].sort((a, b) => {
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      return b.createdAt - a.createdAt;
    });

    const featuredIds = new Set<string>();

    // 🔴 Bài nổi bật trong ngày (nhiều tim nhất trong 24h qua)
    const todayPosts = sortedByLikes.filter(
      (p) => now - p.createdAt <= ONE_DAY
    );
    const todayTop = todayPosts[0];
    if (todayTop) featuredIds.add(todayTop.id);

    // 🔵 Toàn thời gian (nhiều tim nhất từ trước tới giờ)
    const allTimeTop = sortedByLikes.find((p) => !featuredIds.has(p.id));
    if (allTimeTop) featuredIds.add(allTimeTop.id);

    // 🟢 Tuần này (nhiều tim nhất trong 7 ngày qua, loại trừ các bài đã chọn)
    const weekPosts = sortedByLikes.filter(
      (p) =>
        now - p.createdAt <= ONE_WEEK &&
        !featuredIds.has(p.id)
    );
    const weekTop = weekPosts[0];
    if (weekTop) featuredIds.add(weekTop.id);

    // 🟡 Tháng này (nhiều tim nhất trong 30 ngày qua, loại trừ các bài đã chọn)
    const monthPosts = sortedByLikes.filter(
      (p) =>
        now - p.createdAt <= ONE_MONTH &&
        !featuredIds.has(p.id)
    );
    const monthTop = monthPosts[0];
    if (monthTop) featuredIds.add(monthTop.id);

    // ⬜ Còn lại: sắp theo thứ tự thời gian (mới → cũ)
    const rest = posts
      .filter((p) => !featuredIds.has(p.id))
      .sort((a, b) => b.createdAt - a.createdAt);

    return {
      today: todayTop,
      allTime: allTimeTop,
      week: weekTop,
      month: monthTop,
      rest,
    };
  }, [posts, now]);

  const savedPosts = useMemo(
    () =>
      savedIds
        .map((id) => posts.find((p) => p.id === id))
        .filter((p): p is SharePost => !!p),
    [savedIds, posts]
  );

  const feedRef = useGsapReveal<HTMLDivElement>("stagger", [
    tab,
    posts.length,
    savedPosts.length,
    loadingPosts,
    loadingSaved,
    restVisible,
  ]);

  const loading = loadingPosts || loadingSaved;

  const handleOpenPost = (post: SharePost) => {
    setActivePost(post);
  };

  const handleCloseModal = () => {
    setActivePost(null);
  };

  return (
    <div ref={feedRef} className="mx-auto max-w-3xl space-y-3 p-1">
      {isGuest && (
        <div data-reveal-item className="rounded-xl bg-amber-500/10 px-3 py-2">
          <GuestRestrictedHint action="tim và bình luận bài viết" />
        </div>
      )}

      <div data-reveal-item className="glass-panel !py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Bảng tin cộng đồng
            </h1>
          </div>
          {authMode === "user" && (
            <button
              type="button"
              onClick={() => setWriteOpen(true)}
              className="btn-primary flex items-center gap-1.5 !px-3 !py-2 text-xs"
            >
              <PenLine className="h-3.5 w-3.5" />
              Viết bài
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-1 rounded-xl bg-white/40 p-1 dark:bg-cold-800/40">
          <TabButton
            active={tab === "feed"}
            onClick={() => setTab("feed")}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Bảng tin"
            badge={posts.length}
          />
          <TabButton
            active={tab === "saved"}
            onClick={() => setTab("saved")}
            icon={<Bookmark className="h-3.5 w-3.5" />}
            label="Đã lưu"
            badge={savedIds.length}
            highlight
          />
        </div>
      </div>

      <ShareWriteModal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onPosted={() => setFeedKey((k) => k + 1)}
      />

      {tab === "feed" ? (
        loading ? (
          <SkeletonFeed />
        ) : posts.length === 0 ? (
          <div data-reveal-item className="glass-panel text-center text-sm text-stone-500">
            Chưa có bài nào. Bấm <strong>Viết bài</strong> để đăng bài đầu tiên!
          </div>
        ) : (
          <MagazineFeed
            today={featured.today}
            allTime={featured.allTime}
            week={featured.week}
            month={featured.month}
            rest={featured.rest}
            restVisible={restVisible}
            pageSize={REST_PAGE_SIZE}
            onSeeMore={() => setRestVisible((v) => v + REST_PAGE_SIZE)}
            onOpen={handleOpenPost}
          />
        )
      ) : loading ? (
        <div className="space-y-3">
          <SkeletonPostPreview />
          <SkeletonPostPreview />
          <SkeletonPostPreview />
        </div>
      ) : savedIds.length === 0 ? (
        <div data-reveal-item className="glass-panel text-center text-sm text-stone-500">
          Chưa lưu bài nào. Bấm <strong>Lưu</strong> trên bài bạn thích để xem
          lại tại đây!
        </div>
      ) : savedPosts.length === 0 ? (
        <div data-reveal-item className="glass-panel text-center text-sm text-stone-500">
          Các bài đã lưu không còn trên bảng tin hoặc đã bị xóa.
        </div>
      ) : (
        <div className="space-y-3">
          {savedPosts.map((post) => (
            <SharePostPreview
              key={post.id}
              post={post}
              onOpen={handleOpenPost}
            />
          ))}
        </div>
      )}

      <SharePostDetailModal post={activePost} onClose={handleCloseModal} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "bg-white text-stone-900 shadow-sm dark:bg-cold-700 dark:text-white"
          : "text-stone-500 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-cold-700/50"
      )}
    >
      {icon}
      {label}
      {typeof badge === "number" && badge > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            highlight
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
              : "bg-violet-500/15 text-violet-700 dark:text-violet-300"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function MagazineFeed({
  today,
  allTime,
  week,
  month,
  rest,
  restVisible,
  pageSize,
  onSeeMore,
  onOpen,
}: {
  today?: SharePost;
  allTime?: SharePost;
  week?: SharePost;
  month?: SharePost;
  rest: SharePost[];
  restVisible: number;
  pageSize: number;
  onSeeMore: () => void;
  onOpen: (post: SharePost) => void;
}) {
  // Tính số ô featured đang có để quyết định layout responsive
  const featuredCount = [today, allTime, week, month].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Hàng trên: Đỏ (today, lớn bên trái) + Cyan (all-time, ô ngang bên phải) */}
      {(today || allTime) && (
        <div
          data-reveal-item
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
          style={{ minHeight: featuredCount > 0 ? "260px" : undefined }}
        >
          {today && (
            <div className="md:row-span-1">
              <SharePostPreview
                post={today}
                variant="today"
                onOpen={onOpen}
              />
            </div>
          )}
          <div className="flex flex-col gap-3">
            {allTime && (
              <div className="flex-1">
                <SharePostPreview
                  post={allTime}
                  variant="allTime"
                  onOpen={onOpen}
                />
              </div>
            )}
            {(week || month) && (
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                {week && (
                  <SharePostPreview
                    post={week}
                    variant="week"
                    onOpen={onOpen}
                  />
                )}
                {month && (
                  <SharePostPreview
                    post={month}
                    variant="month"
                    onOpen={onOpen}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hàng dưới: các bài còn lại (xám), tối đa 3 bài + nút xem thêm */}
      {rest.length > 0 && (
        <section data-reveal-item className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-warm-border pb-1.5 dark:border-cold-border">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-stone-400" />
              Bài viết mới
            </h2>
            <span className="text-[10px] text-stone-400">
              {rest.length} bài
            </span>
          </div>

          <div className="space-y-2">
            {rest.slice(0, restVisible).map((post) => (
              <SharePostPreview
                key={post.id}
                post={post}
                onOpen={onOpen}
              />
            ))}
          </div>

          {restVisible < rest.length && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onSeeMore}
                className="btn-secondary flex items-center gap-1.5 !px-4 !py-2 text-xs"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Xem thêm ({rest.length - restVisible} bài cũ hơn)
              </button>
            </div>
          )}
        </section>
      )}

      {featuredCount === 0 && rest.length === 0 && (
        <div className="glass-panel text-center text-sm text-stone-500">
          Chưa có bài nào để hiển thị.
        </div>
      )}
    </div>
  );
}