"use client";

import { Share2, Lock } from "lucide-react";
import { ACHIEVEMENTS } from "@/types/reading";
import type { ReadingStats } from "@/types/reading";
import { cn } from "@/lib/cn";

interface AchievementsPanelProps {
  stats: ReadingStats;
  onShareAchievement: (achievementId: string) => void;
  sharingId: string | null;
  compact?: boolean;
  embedded?: boolean;
}

export default function AchievementsPanel({
  stats,
  onShareAchievement,
  sharingId,
  compact = false,
  embedded = false,
}: AchievementsPanelProps) {
  const unlocked = stats.unlockedAchievements.length;
  const progress = Math.round((unlocked / ACHIEVEMENTS.length) * 100);

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
          <p className="text-[10px] font-bold text-stone-700 dark:text-slate-200">
            Thành tựu · {unlocked}/{ACHIEVEMENTS.length}
          </p>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-200/60 dark:bg-cold-800/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = stats.unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1",
                  isUnlocked
                    ? "bg-violet-500/10 ring-1 ring-violet-400/20"
                    : "bg-white/25 dark:bg-cold-800/20",
                )}
              >
                <span className="text-sm leading-none">
                  {isUnlocked ? ach.emoji : <Lock className="h-3.5 w-3.5 text-stone-400" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-stone-800 dark:text-slate-100">
                    {ach.name}
                  </p>
                  <p className="truncate text-[10px] text-stone-500 dark:text-slate-400">
                    {ach.description}
                  </p>
                </div>
                {isUnlocked && (
                  <button
                    type="button"
                    onClick={() => onShareAchievement(ach.id)}
                    disabled={sharingId === ach.id}
                    className="shrink-0 rounded p-1 text-violet-500 hover:bg-violet-500/10"
                    title="Chia sẻ"
                  >
                    <Share2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-panel space-y-3", compact && "!p-3")}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            Thành tựu đọc sách
          </h3>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            {unlocked}/{ACHIEVEMENTS.length} đã mở khóa · {progress}%
          </p>
        </div>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-stone-200/60 dark:bg-cold-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = stats.unlockedAchievements.includes(ach.id);
          return (
            <div
              key={ach.id}
              className={cn(
                "flex items-start gap-2 rounded-xl p-2.5",
                isUnlocked
                  ? "bg-gradient-to-br from-violet-500/12 to-rose-500/10 ring-1 ring-violet-400/25"
                  : "bg-white/30 opacity-70 dark:bg-cold-800/25",
              )}
            >
              <span className="text-lg leading-none">
                {isUnlocked ? ach.emoji : <Lock className="h-4 w-4 text-stone-400" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-stone-800 dark:text-slate-100">
                  {ach.name}
                </p>
                <p className="text-[10px] leading-snug text-stone-500 dark:text-slate-400">
                  {ach.description}
                </p>
              </div>
              {isUnlocked && (
                <button
                  type="button"
                  onClick={() => onShareAchievement(ach.id)}
                  disabled={sharingId === ach.id}
                  className="shrink-0 rounded-lg p-1 text-violet-500 hover:bg-violet-500/10"
                  title="Chia sẻ lên bảng tin"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
