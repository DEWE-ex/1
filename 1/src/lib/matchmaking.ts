import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  runTransaction,
} from "firebase/database";
import { getDb } from "./firebase";
import { createRoom, joinRoom } from "./game";
import type { MatchmakingEntry } from "@/types/game";

const QUEUE_PATH = "matchmaking";
const STALE_MS = 5 * 60 * 1000;

async function cleanupStaleEntries(
  entries: Record<string, MatchmakingEntry>
): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const removals = Object.entries(entries)
    .filter(([, e]) => now - e.joinedAt > STALE_MS && !e.roomCode)
    .map(([id]) => remove(ref(db, `${QUEUE_PATH}/${id}`)));
  await Promise.all(removals);
}

function findOpponent(
  entries: Record<string, MatchmakingEntry>,
  playerId: string
): [string, MatchmakingEntry] | null {
  const candidates = Object.entries(entries)
    .filter(
      ([id, e]) =>
        id !== playerId && !e.roomCode && !e.matchedBy
    )
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  return candidates[0] ?? null;
}

export async function joinMatchmaking(
  playerId: string,
  playerName: string
): Promise<{ status: "matched"; roomCode: string } | { status: "waiting" }> {
  const db = getDb();
  const selfRef = ref(db, `${QUEUE_PATH}/${playerId}`);

  const existing = await get(selfRef);
  if (existing.exists()) {
    const data = existing.val() as MatchmakingEntry;
    if (data.roomCode) {
      return { status: "matched", roomCode: data.roomCode };
    }
    if (data.matchedBy) {
      return { status: "waiting" };
    }
  }

  if (!existing.exists()) {
    await set(selfRef, {
      name: playerName,
      joinedAt: Date.now(),
      roomCode: null,
      matchedBy: null,
    } satisfies MatchmakingEntry);
  } else {
    await update(selfRef, {
      name: playerName,
      joinedAt: Date.now(),
    });
  }

  const queueSnap = await get(ref(db, QUEUE_PATH));
  if (!queueSnap.exists()) {
    return { status: "waiting" };
  }

  const entries = queueSnap.val() as Record<string, MatchmakingEntry>;
  await cleanupStaleEntries(entries);

  const freshSnap = await get(ref(db, QUEUE_PATH));
  if (!freshSnap.exists()) {
    return { status: "waiting" };
  }

  const freshEntries = freshSnap.val() as Record<string, MatchmakingEntry>;
  const selfEntry = freshEntries[playerId];
  if (selfEntry?.roomCode) {
    return { status: "matched", roomCode: selfEntry.roomCode };
  }
  if (selfEntry?.matchedBy) {
    return { status: "waiting" };
  }

  const opponent = findOpponent(freshEntries, playerId);
  if (!opponent) {
    return { status: "waiting" };
  }

  const [opponentId, opponentEntry] = opponent;
  const opponentRef = ref(db, `${QUEUE_PATH}/${opponentId}`);

  const tx = await runTransaction(opponentRef, (data: MatchmakingEntry | null) => {
    if (!data || data.roomCode || data.matchedBy) return;
    return { ...data, matchedBy: playerId };
  });

  if (!tx.committed) {
    return { status: "waiting" };
  }

  const locked = tx.snapshot.val() as MatchmakingEntry;
  if (locked.matchedBy !== playerId) {
    return { status: "waiting" };
  }

  try {
    const roomCode = await createRoom(opponentId, opponentEntry.name, "random");
    const joined = await joinRoom(roomCode, playerId, playerName);
    if (!joined) {
      await update(opponentRef, { matchedBy: null });
      return { status: "waiting" };
    }

    await update(opponentRef, { roomCode });
    await update(selfRef, { roomCode });

    return { status: "matched", roomCode };
  } catch {
    await update(opponentRef, { matchedBy: null });
    return { status: "waiting" };
  }
}

export function subscribeMatchmaking(
  playerId: string,
  callback: (entry: MatchmakingEntry | null) => void
): () => void {
  const db = getDb();
  const entryRef = ref(db, `${QUEUE_PATH}/${playerId}`);
  return onValue(entryRef, (snap) => {
    callback(snap.exists() ? (snap.val() as MatchmakingEntry) : null);
  });
}

export async function leaveMatchmaking(playerId: string): Promise<void> {
  const db = getDb();
  const entryRef = ref(db, `${QUEUE_PATH}/${playerId}`);
  const snap = await get(entryRef);
  if (!snap.exists()) return;
  const data = snap.val() as MatchmakingEntry;
  if (data.matchedBy && !data.roomCode) return;
  await remove(entryRef);
}
