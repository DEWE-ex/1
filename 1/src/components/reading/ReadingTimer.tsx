"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookMarked,
  Clock,
  Flame,
  History,
  Play,
  Trophy,
} from "lucide-react";
import { parseYoutubeVideoId } from "@/lib/youtube";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  loadReadingStats,
  recordReadingSession,
  formatReadingTime,
  getAchievementById,
  updateSessionPageNumber,
} from "@/lib/reading";
import { createSharePost } from "@/lib/shares";
import { ACHIEVEMENTS } from "@/types/reading";
import type { Achievement, ReadingStats, ReadingSession } from "@/types/reading";
import ReadingLockScreen from "./ReadingLockScreen";
import AchievementsPanel from "./AchievementsPanel";
import ReadingSessionModal from "./ReadingSessionModal";
import BookLoading from "@/components/ui/BookLoading";
import GuestRestrictedHint from "@/components/ui/GuestRestrictedHint";
import { cn } from "@/lib/cn";

const PRESETS = [15, 30, 45, 60, 90, 120];

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="reading-mini-stat">
      <div className={cn("reading-mini-stat-icon", color)}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-stone-400 dark:text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-stone-800 dark:text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ReadingTimer() {
  const router = useRouter();
  const { playerId, displayName, photoURL, isGuest } = useAuth();

  const [bookTitle, setBookTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [duration, setDuration] = useState(30);
  const [customMinutes, setCustomMinutes] = useState("");
  const [active, setActive] = useState(false);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionResult, setSessionResult] = useState<{
    minutes: number;
    achievements: Achievement[];
  } | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<ReadingSession | null>(null);
  const [isNewSession, setIsNewSession] = useState(false);

  useEffect(() => {
    if (!playerId) return;
    loadReadingStats(playerId).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [playerId]);

  const effectiveMinutes = customMinutes
    ? Math.min(180, Math.max(5, Number(customMinutes) || duration))
    : duration;

  const handleStart = () => {
    if (!bookTitle.trim()) {
      alert("Vui lòng nhập tên sách");
      return;
    }
    setSessionResult(null);
    setActive(true);
  };

  const finishSession = useCallback(
    async (elapsedSeconds: number) => {
      setActive(false);
      const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const { stats: updated, newAchievements, session } = await recordReadingSession(
        playerId,
        bookTitle.trim(),
        minutes,
      );
      setStats(updated);
      setSessionResult({ minutes, achievements: newAchievements });
      setEditingSession(session);
      setIsNewSession(true);
    },
    [playerId, bookTitle],
  );

  const handleSavePageNumber = async (pageNumber: number | null) => {
    if (!editingSession) return;
    const updated = await updateSessionPageNumber(playerId, editingSession.id, pageNumber);
    setStats(updated);
  };

  const handleShareAchievement = async (achievementId: string) => {
    if (!playerId) return;
    const ach = getAchievementById(achievementId);
    if (!ach) return;
    setSharingId(achievementId);
    try {
      await createSharePost(
        playerId,
        displayName,
        photoURL ?? undefined,
        `Vừa đạt thành tựu "${ach.name}" — ${ach.description}!`,
        undefined,
        bookTitle || undefined,
        "achievement",
        achievementId,
      );
      router.push("/share");
    } finally {
      setSharingId(null);
    }
  };

  const handleShareSession = async () => {
    if (isGuest || !playerId || !sessionResult) return;
    setSharingId("session");
    try {
      await createSharePost(
        playerId,
        displayName,
        photoURL ?? undefined,
        `Vừa hoàn thành phiên đọc "${bookTitle}" trong ${formatReadingTime(sessionResult.minutes)}!`,
        undefined,
        bookTitle,
        "reading",
      );
      router.push("/share");
    } finally {
      setSharingId(null);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center">
        <BookLoading label="Đang tải..." />
      </div>
    );
  }

  const youtubeVideoId = parseYoutubeVideoId(youtubeUrl);
  const unlockedCount = stats.unlockedAchievements.length;

  if (active) {
    return (
      <ReadingLockScreen
        bookTitle={bookTitle}
        totalSeconds={effectiveMinutes * 60}
        youtubeVideoId={youtubeVideoId ?? undefined}
        onComplete={finishSession}
        onEmergencyExit={finishSession}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-2 px-1 pt-1 lg:h-[calc(100dvh-2rem)] lg:overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-stone-900 dark:text-white md:text-xl">
            Không gian đọc sách
          </h1>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-rose-500">
          <BookMarked className="h-5 w-5 text-white" />
        </div>
      </div>

      {sessionResult && (
        <div className="glass-panel flex shrink-0 items-center justify-between gap-3 !py-2.5 text-sm">
          <span>
            <Trophy className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
            Đã đọc {formatReadingTime(sessionResult.minutes)}
            {sessionResult.achievements.length > 0 &&
              ` · +${sessionResult.achievements.length} thành tựu`}
          </span>
          {!isGuest && (
            <button
              type="button"
              onClick={handleShareSession}
              disabled={sharingId === "session"}
              className="btn-secondary !px-2 !py-1 text-[10px]"
            >
              Chia sẻ
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.35fr_1fr] lg:[grid-template-rows:1fr]">
        <section className="glass-panel flex h-full flex-col lg:min-h-0" style={{ padding: '1rem' }}>
          <h2 className="shrink-0 text-sm font-bold text-stone-800 dark:text-slate-100">
            Thiết lập phiên đọc
          </h2>
          <div className="mt-3 flex min-h-0 flex-1 flex-col justify-between overflow-y-auto pr-0.5">
            <input
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Tên sách đang đọc..."
              className="input-field !py-2.5 text-sm"
              maxLength={100}
            />
            <div className="relative">
              <Play className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
              <input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Link nhạc YouTube (tùy chọn)"
                className="input-field !py-2.5 !pl-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setDuration(m);
                    setCustomMinutes("");
                  }}
                  className={cn(
                    "reading-preset-btn !py-2.5 text-sm",
                    duration === m && !customMinutes && "reading-preset-btn-active",
                  )}
                >
                  {m}p
                </button>
              ))}
            </div>
            <input
              type="number"
              min={5}
              max={180}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="Tùy chỉnh thời gian"
              className="input-field !py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={handleStart}
              className="btn-primary flex w-full items-center justify-center gap-2 !py-3 text-sm font-bold"
            >
              <Play className="h-4 w-4" />
              Bắt đầu · {effectiveMinutes} phút
            </button>

            <div className="grid grid-cols-2 gap-3 border-t border-stone-200/40 pt-1 dark:border-slate-800/40">
              <MiniStat
                icon={Clock}
                label="Tổng đọc"
                value={formatReadingTime(stats.totalMinutes)}
                color="bg-violet-500"
              />
              <MiniStat
                icon={Flame}
                label="Dài nhất"
                value={`${stats.longestSessionMinutes}p`}
                color="bg-orange-500"
              />
              <MiniStat
                icon={Trophy}
                label="Thành tựu"
                value={`${unlockedCount}/${ACHIEVEMENTS.length}`}
                color="bg-amber-500"
              />
              <MiniStat
                icon={History}
                label="Phiên"
                value={`${stats.sessions.length}`}
                color="bg-emerald-500"
              />
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-3 lg:min-h-0">
          <div className="glass-panel flex h-full flex-col overflow-hidden !p-4 lg:min-h-0 lg:flex-1">
            <h3 className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-stone-800 dark:text-slate-100">
              <History className="h-4 w-4 text-violet-500" />
              Lịch sử gần đây
            </h3>

            {stats.sessions.length > 0 && (
              <ul className="mt-3 shrink-0 space-y-1.5">
                {stats.sessions.slice(0, 3).map((s) => (
                  <li
                    key={s.id}
                    onClick={() => {
                      setEditingSession(s);
                      setIsNewSession(false);
                    }}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white/40 px-3 py-2.5 text-xs dark:bg-cold-800/30 cursor-pointer hover:bg-white/60 dark:hover:bg-cold-800/50 transition"
                  >
                    <span className="truncate font-medium flex-1 text-left">{s.bookTitle}</span>
                    {s.pageNumber !== undefined && (
                      <span className="shrink-0 font-semibold text-violet-650 dark:text-violet-400 mr-1.5">
                        Tr. {s.pageNumber}
                      </span>
                    )}
                    <span className="shrink-0 text-stone-400">{s.durationMinutes}p</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 min-h-0 flex-1 overflow-hidden">
              <AchievementsPanel
                compact
                embedded
                stats={stats}
                onShareAchievement={handleShareAchievement}
                sharingId={sharingId}
              />
            </div>
          </div>
        </aside>
      </div>

      <ReadingSessionModal
        open={editingSession !== null}
        session={editingSession}
        isNewSession={isNewSession}
        onClose={() => setEditingSession(null)}
        onSave={handleSavePageNumber}
      />
    </div>
  );
}
