"use client";

import { useEffect, useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { subscribeLeaderboard } from "@/lib/leaderboard";
import type { LeaderboardEntry } from "@/types/game";

export default function LeaderboardPage() {
  const { playerId, displayName, user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeLeaderboard((data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const myRank = entries.findIndex((e) => e.userId === playerId) + 1;
  const myEntry = entries.find((e) => e.userId === playerId);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-1">
      <div className="glass-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-glow">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Bảng xếp hạng Karuta</h1>
            <p className="text-sm text-stone-500 dark:text-slate-400">
              Top người chơi thắng nhiều nhất
            </p>
          </div>
        </div>
      </div>

      {myEntry && (
        <div className="glass rounded-2xl border-2 border-warm-400/30 p-4 dark:border-cold-400/30">
          <p className="text-xs uppercase text-stone-400">Hạng của bạn</p>
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-warm-600 dark:text-cold-300">
                #{myRank}
              </span>
              <div>
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-stone-500">
                  {myEntry.wins} thắng · {myEntry.losses} thua ·{" "}
                  {myEntry.winRate}% WR
                </p>
              </div>
            </div>
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="h-10 w-10 rounded-full"
              />
            )}
          </div>
        </div>
      )}

      <div className="glass-panel">
        {loading ? (
          <p className="animate-pulse text-center text-stone-500">
            Đang tải...
          </p>
        ) : entries.length === 0 ? (
          <p className="text-center text-sm text-stone-500">
            Chưa có trận đấu nào. Chơi Karuta để lên bảng!
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry, idx) => (
              <li
                key={entry.userId}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  entry.userId === playerId
                    ? "bg-warm-400/10 dark:bg-cold-400/10"
                    : ""
                }`}
              >
                <RankBadge rank={idx + 1} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{entry.displayName}</p>
                  <p className="text-xs text-stone-500">
                    {entry.wins}W · {entry.losses}L · {entry.gamesPlayed} trận ·{" "}
                    {entry.winRate}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <Crown className="h-6 w-6 shrink-0 text-yellow-500" />;
  if (rank === 2)
    return <Medal className="h-6 w-6 shrink-0 text-slate-400" />;
  if (rank === 3)
    return <Medal className="h-6 w-6 shrink-0 text-amber-700" />;
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-sm font-bold text-stone-400">
      {rank}
    </span>
  );
}
