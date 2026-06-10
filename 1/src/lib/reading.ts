import { ref, get, set } from "firebase/database";
import { getDb } from "./firebase";
import {
  ACHIEVEMENTS,
  type Achievement,
  type ReadingSession,
  type ReadingStats,
} from "@/types/reading";

const LOCAL_KEY = "bookfinder_reading_stats";

const EMPTY_STATS: ReadingStats = {
  totalMinutes: 0,
  longestSessionMinutes: 0,
  sessions: [],
  unlockedAchievements: [],
  updatedAt: Date.now(),
};

function normalizeStats(data: Partial<ReadingStats> | null): ReadingStats {
  if (!data) return { ...EMPTY_STATS };
  return {
    totalMinutes: data.totalMinutes ?? 0,
    longestSessionMinutes: data.longestSessionMinutes ?? 0,
    sessions: data.sessions ?? [],
    unlockedAchievements: data.unlockedAchievements ?? [],
    updatedAt: data.updatedAt ?? Date.now(),
  };
}

export function getLocalReadingStats(): ReadingStats {
  if (typeof window === "undefined") return { ...EMPTY_STATS };
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return { ...EMPTY_STATS };
  try {
    return normalizeStats(JSON.parse(raw));
  } catch {
    return { ...EMPTY_STATS };
  }
}

function saveLocalReadingStats(stats: ReadingStats): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(stats));
}

export async function loadReadingStats(userId: string | null): Promise<ReadingStats> {
  if (!userId || userId.startsWith("guest_")) {
    return getLocalReadingStats();
  }
  try {
    const db = getDb();
    const snap = await get(ref(db, `readingStats/${userId}`));
    if (snap.exists()) {
      const cloud = normalizeStats(snap.val());
      saveLocalReadingStats(cloud);
      return cloud;
    }
  } catch {
    /* fallback local */
  }
  return getLocalReadingStats();
}

export async function saveReadingStats(
  userId: string | null,
  stats: ReadingStats
): Promise<void> {
  const payload = { ...stats, updatedAt: Date.now() };
  saveLocalReadingStats(payload);
  if (!userId || userId.startsWith("guest_")) return;
  try {
    const db = getDb();
    await set(ref(db, `readingStats/${userId}`), payload);
  } catch {
    /* local only */
  }
}

function checkAchievement(stats: ReadingStats, ach: Achievement): boolean {
  if (stats.unlockedAchievements.includes(ach.id)) return false;
  if (ach.totalMinutes !== undefined && stats.totalMinutes >= ach.totalMinutes) {
    return true;
  }
  if (
    ach.sessionMinutes !== undefined &&
    stats.longestSessionMinutes >= ach.sessionMinutes
  ) {
    return true;
  }
  return false;
}

export function getNewlyUnlocked(
  stats: ReadingStats,
  sessionMinutes: number
): Achievement[] {
  const virtual: ReadingStats = {
    ...stats,
    longestSessionMinutes: Math.max(stats.longestSessionMinutes, sessionMinutes),
  };
  return ACHIEVEMENTS.filter((a) => checkAchievement(virtual, a));
}

export async function recordReadingSession(
  userId: string | null,
  bookTitle: string,
  durationMinutes: number
): Promise<{ stats: ReadingStats; newAchievements: Achievement[]; session: ReadingSession }> {
  const stats = await loadReadingStats(userId);
  const session: ReadingSession = {
    id: `s_${Date.now()}`,
    bookTitle,
    durationMinutes,
    completedAt: Date.now(),
  };

  const updated: ReadingStats = {
    totalMinutes: stats.totalMinutes + durationMinutes,
    longestSessionMinutes: Math.max(stats.longestSessionMinutes, durationMinutes),
    sessions: [session, ...stats.sessions].slice(0, 50),
    unlockedAchievements: [...stats.unlockedAchievements],
    updatedAt: Date.now(),
  };

  const newAchievements = getNewlyUnlocked(updated, durationMinutes).filter(
    (a) => !updated.unlockedAchievements.includes(a.id)
  );

  for (const ach of newAchievements) {
    updated.unlockedAchievements.push(ach.id);
  }

  await saveReadingStats(userId, updated);
  return { stats: updated, newAchievements, session };
}

export async function updateSessionPageNumber(
  userId: string | null,
  sessionId: string,
  pageNumber: number | null
): Promise<ReadingStats> {
  const stats = await loadReadingStats(userId);
  const updatedSessions = stats.sessions.map((s) =>
    s.id === sessionId ? { ...s, pageNumber: pageNumber ?? undefined } : s
  );
  const updated: ReadingStats = {
    ...stats,
    sessions: updatedSessions,
    updatedAt: Date.now(),
  };
  await saveReadingStats(userId, updated);
  return updated;
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function formatReadingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}
