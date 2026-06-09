"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Play, Trophy } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  loadReadingStats,
  recordReadingSession,
  formatReadingTime,
  getAchievementById,
} from "@/lib/reading";
import { createSharePost } from "@/lib/shares";
import type { Achievement, ReadingStats } from "@/types/reading";
import ReadingLockScreen from "./ReadingLockScreen";
import AchievementsPanel from "./AchievementsPanel";
import BookLoading from "@/components/ui/BookLoading";

const PRESETS = [15, 30, 45, 60, 90, 120];

export default function ReadingTimer() {
  const router = useRouter();
  const { playerId, displayName, photoURL } = useAuth();

  const [bookTitle, setBookTitle] = useState("");
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

  const finishSession = async (elapsedSeconds: number) => {
    setActive(false);
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const { stats: updated, newAchievements } = await recordReadingSession(
      playerId,
      bookTitle.trim(),
      minutes
    );
    setStats(updated);
    setSessionResult({ minutes, achievements: newAchievements });
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
        `🏆 Vừa đạt thành tựu "${ach.name}" — ${ach.description}!`,
        undefined,
        bookTitle || undefined,
        "achievement",
        achievementId
      );
      router.push("/share");
    } finally {
      setSharingId(null);
    }
  };

  const handleShareSession = async () => {
    if (!playerId || !sessionResult) return;
    setSharingId("session");
    try {
      await createSharePost(
        playerId,
        displayName,
        photoURL ?? undefined,
        `📚 Vừa hoàn thành phiên đọc "${bookTitle}" trong ${formatReadingTime(sessionResult.minutes)}!`,
        undefined,
        bookTitle,
        "reading"
      );
      router.push("/share");
    } finally {
      setSharingId(null);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <BookLoading label="Đang tải..." />
      </div>
    );
  }

  if (active) {
    return (
      <ReadingLockScreen
        bookTitle={bookTitle}
        totalSeconds={effectiveMinutes * 60}
        onComplete={finishSession}
        onEmergencyExit={finishSession}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-1">
      <div className="glass-panel animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-rose-500">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-white">
              Đồng hồ đọc sách
            </h1>
            <p className="text-sm text-stone-500 dark:text-slate-400">
              Khóa màn hình, tập trung đọc đến hết giờ
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <input
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="Tên sách đang đọc..."
            className="input-field"
            maxLength={100}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-stone-600 dark:text-slate-300">
              Thời gian (phút)
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setDuration(m);
                    setCustomMinutes("");
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    duration === m && !customMinutes
                      ? "bg-gradient-to-r from-violet-500 to-rose-500 text-white"
                      : "glass"
                  }`}
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
              placeholder="Hoặc nhập số phút (5–180)"
              className="input-field mt-2"
            />
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            <Play className="h-5 w-5" />
            Bắt đầu đọc ({effectiveMinutes} phút)
          </button>

          <p className="text-center text-xs text-stone-400 dark:text-slate-500">
            Màn hình sẽ khóa toàn màn. Giữ nút khẩn cấp 3 giây để thoát sớm.
          </p>
        </div>
      </div>

      {sessionResult && (
        <div className="animate-scale-in glass-panel text-center">
          <Trophy className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-3 text-lg font-bold">Phiên đọc hoàn thành!</h2>
          <p className="mt-1 text-stone-600 dark:text-slate-300">
            Đã đọc <strong>{formatReadingTime(sessionResult.minutes)}</strong>
          </p>
          {sessionResult.achievements.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-violet-600 dark:text-violet-300">
                Thành tựu mới!
              </p>
              {sessionResult.achievements.map((a) => (
                <p key={a.id} className="text-sm">
                  {a.emoji} {a.name}
                </p>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleShareSession}
            disabled={sharingId === "session"}
            className="btn-secondary mt-4"
          >
            {sharingId === "session" ? "Đang chia sẻ..." : "Chia sẻ lên bảng tin"}
          </button>
        </div>
      )}

      <AchievementsPanel
        stats={stats}
        onShareAchievement={handleShareAchievement}
        sharingId={sharingId}
      />
    </div>
  );
}
