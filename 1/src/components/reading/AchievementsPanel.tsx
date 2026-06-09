"use client";

import { Share2, Lock } from "lucide-react";
import { ACHIEVEMENTS } from "@/types/reading";
import type { ReadingStats } from "@/types/reading";

interface AchievementsPanelProps {
  stats: ReadingStats;
  onShareAchievement: (achievementId: string) => void;
  sharingId: string | null;
}

export default function AchievementsPanel({
  stats,
  onShareAchievement,
  sharingId,
}: AchievementsPanelProps) {
  return (
    <div className="glass-panel space-y-4">
      <div>
        <h3 className="font-bold text-stone-900 dark:text-white">
          Thành tựu đọc sách
        </h3>
        <p className="text-sm text-stone-500 dark:text-slate-400">
          Tổng đã đọc:{" "}
          <strong className="text-violet-600 dark:text-violet-300">
            {stats.totalMinutes} phút
          </strong>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map((ach) => {
          const unlocked = stats.unlockedAchievements.includes(ach.id);
          return (
            <div
              key={ach.id}
              className={`animate-card-in rounded-xl p-4 transition ${
                unlocked
                  ? "bg-gradient-to-br from-violet-500/10 to-rose-500/10 ring-1 ring-violet-400/30"
                  : "glass opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{unlocked ? ach.emoji : <Lock className="h-6 w-6 text-stone-400" />}</span>
                  <div>
                    <p className="font-semibold text-stone-800 dark:text-slate-100">
                      {ach.name}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      {ach.description}
                    </p>
                  </div>
                </div>
                {unlocked && (
                  <button
                    type="button"
                    onClick={() => onShareAchievement(ach.id)}
                    disabled={sharingId === ach.id}
                    className="shrink-0 rounded-lg p-2 text-violet-500 transition hover:bg-violet-500/10"
                    title="Chia sẻ lên bảng tin"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
