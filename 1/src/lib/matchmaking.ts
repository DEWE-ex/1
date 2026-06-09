import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  runTransaction,
  onDisconnect,
} from "firebase/database";
import { getDb } from "./firebase";
import { createRoom, joinRoom } from "./game";
import type { MatchmakingEntry } from "@/types/game";

const QUEUE_PATH = "matchmaking";
const STALE_MS = 5 * 60 * 1000;
const RETRY_COOLDOWN_MS = 2500;

const inFlight = new Map<string, Promise<MatchResult>>();

type MatchResult =
  | { status: "matched"; roomCode: string }
  | { status: "waiting" };

async function cleanupStaleEntries(
  entries: Record<string, MatchmakingEntry>
): Promise<boolean> {
  const db = getDb();
  const now = Date.now();
  const staleIds = Object.entries(entries)
    .filter(([, e]) => now - e.joinedAt > STALE_MS && !e.roomCode)
    .map(([id]) => id);

  if (staleIds.length === 0) return false;

  const updates: Record<string, null> = {};
  staleIds.forEach((id) => {
    updates[`${QUEUE_PATH}/${id}`] = null;
  });
  await update(ref(db, QUEUE_PATH), updates);
  return true;
}

function findOpponent(
  entries: Record<string, MatchmakingEntry>,
  playerId: string
): [string, MatchmakingEntry] | null {
  const candidates = Object.entries(entries)
    .filter(
      ([id, e]) => id !== playerId && !e.roomCode && !e.matchedBy
    )
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  return candidates[0] ?? null;
}

async function joinMatchmakingInternal(
  playerId: string,
  playerName: string
): Promise<MatchResult> {
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
    await onDisconnect(selfRef).remove();
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
  const didCleanup = await cleanupStaleEntries(entries);

  let freshEntries = entries;
  if (didCleanup) {
    const freshSnap = await get(ref(db, QUEUE_PATH));
    if (!freshSnap.exists()) {
      return { status: "waiting" };
    }
    freshEntries = freshSnap.val() as Record<string, MatchmakingEntry>;
  }

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

    await update(ref(db, QUEUE_PATH), {
      [`${opponentId}/roomCode`]: roomCode,
      [`${playerId}/roomCode`]: roomCode,
    });

    await onDisconnect(selfRef).cancel();
    return { status: "matched", roomCode };
  } catch {
    await update(opponentRef, { matchedBy: null });
    return { status: "waiting" };
  }
}

export async function joinMatchmaking(
  playerId: string,
  playerName: string
): Promise<MatchResult> {
  const current = inFlight.get(playerId);
  if (current) return current;

  const promise = joinMatchmakingInternal(playerId, playerName).finally(() => {
    setTimeout(() => inFlight.delete(playerId), RETRY_COOLDOWN_MS);
  });

  inFlight.set(playerId, promise);
  return promise;
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

  if (data.matchedBy && !data.roomCode) {
    return;
  }

  if (data.matchedBy === null && data.roomCode === null) {
    const queueSnap = await get(ref(db, QUEUE_PATH));
    if (queueSnap.exists()) {
      const entries = queueSnap.val() as Record<string, MatchmakingEntry>;
      const lockedByMe = Object.entries(entries).find(
        ([, e]) => e.matchedBy === playerId && !e.roomCode
      );
      if (lockedByMe) {
        await update(ref(db, `${QUEUE_PATH}/${lockedByMe[0]}`), {
          matchedBy: null,
        });
      }
    }
  }

  await onDisconnect(entryRef).cancel();
  await remove(entryRef);
  inFlight.delete(playerId);
}
