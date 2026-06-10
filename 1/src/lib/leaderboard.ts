import {
  ref,
  get,
  runTransaction,
  onValue,
} from "firebase/database";
import { getDb } from "./firebase";
import type { LeaderboardEntry, Room } from "@/types/game";

export async function getLeaderboard(
  limit = 50
): Promise<LeaderboardEntry[]> {
  const db = getDb();
  const snap = await get(ref(db, "leaderboard"));
  if (!snap.exists()) return [];

  const data = snap.val() as Record<string, Omit<LeaderboardEntry, "userId">>;
  return Object.entries(data)
    .map(([userId, entry]) => ({
      userId,
      displayName: entry.displayName,
      photoURL: entry.photoURL,
      wins: entry.wins ?? 0,
      losses: entry.losses ?? 0,
      gamesPlayed: entry.gamesPlayed ?? 0,
      winRate: entry.winRate ?? 0,
      updatedAt: entry.updatedAt ?? 0,
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.winRate - a.winRate;
    })
    .slice(0, limit);
}

export function subscribeLeaderboard(
  callback: (entries: LeaderboardEntry[]) => void,
  limit = 50
): () => void {
  const db = getDb();
  return onValue(ref(db, "leaderboard"), (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const data = snap.val() as Record<string, Omit<LeaderboardEntry, "userId">>;
    const entries = Object.entries(data)
      .map(([userId, entry]) => ({
        userId,
        displayName: entry.displayName,
        photoURL: entry.photoURL,
        wins: entry.wins ?? 0,
        losses: entry.losses ?? 0,
        gamesPlayed: entry.gamesPlayed ?? 0,
        winRate: entry.winRate ?? 0,
        updatedAt: entry.updatedAt ?? 0,
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winRate - a.winRate;
      })
      .slice(0, limit);
    callback(entries);
  });
}

async function bumpPlayerStats(
  userId: string,
  displayName: string,
  photoURL: string | undefined,
  result: "win" | "loss"
): Promise<void> {
  const db = getDb();
  const entryRef = ref(db, `leaderboard/${userId}`);

  await runTransaction(entryRef, (current) => {
    const prev = current ?? {
      displayName,
      photoURL: photoURL ?? null,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      winRate: 0,
      updatedAt: 0,
    };

    const wins = prev.wins + (result === "win" ? 1 : 0);
    const losses = prev.losses + (result === "loss" ? 1 : 0);
    const gamesPlayed = wins + losses;

    return {
      displayName: displayName || prev.displayName,
      photoURL: photoURL ?? prev.photoURL ?? null,
      wins,
      losses,
      gamesPlayed,
      winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
      updatedAt: Date.now(),
    };
  });
}

export async function recordMatchResult(
  roomCode: string,
  room: Room
): Promise<void> {
  if (room.status !== "finished" || !room.gameWinnerId || !room.guestId) {
    return;
  }

  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);

  const lock = await runTransaction(roomRef, (r: Room | null) => {
    if (!r || r.status !== "finished" || r.statsRecorded || !r.gameWinnerId) {
      return r;
    }
    return { ...r, statsRecorded: true };
  });

  if (!lock.committed || !lock.snapshot.val()?.statsRecorded) return;

  const winnerId = room.gameWinnerId;
  const loserId =
    winnerId === room.hostId ? room.guestId : room.hostId;
  if (!loserId) return;

  const winnerName =
    winnerId === room.hostId ? room.hostName : room.guestName!;
  const loserName =
    loserId === room.hostId ? room.hostName : room.guestName!;

  await Promise.all([
    bumpPlayerStats(winnerId, winnerName, undefined, "win"),
    bumpPlayerStats(loserId, loserName, undefined, "loss"),
  ]);
}

export async function getPlayerRank(
  userId: string
): Promise<{ rank: number; entry: LeaderboardEntry | null }> {
  const all = await getLeaderboard(500);
  const idx = all.findIndex((e) => e.userId === userId);
  return {
    rank: idx >= 0 ? idx + 1 : 0,
    entry: idx >= 0 ? all[idx] : null,
  };
}
