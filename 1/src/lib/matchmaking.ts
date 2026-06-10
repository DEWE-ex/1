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
const MATCH_LOCK_MS = 45_000;

type MatchResult =
  | { status: "matched"; roomCode: string }
  | { status: "waiting" };
function pairKey(a: string, b: string): string {
  return [a, b].sort().join("__");
}

async function cleanupStaleEntries(
  entries: Record<string, MatchmakingEntry>,
): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const updates: Record<string, unknown> = {};

  for (const [id, e] of Object.entries(entries)) {
    if (id === "pairs" || typeof e !== "object" || !("joinedAt" in e)) continue;
    const lockStale =
      e.matchedBy &&
      !e.roomCode &&
      e.lockedAt &&
      now - e.lockedAt > MATCH_LOCK_MS;

    if (lockStale) {
      updates[`${id}/matchedBy`] = null;
      updates[`${id}/lockedAt`] = null;
      continue;
    }

    const joinedStale = !e.matchedBy && !e.roomCode && now - e.joinedAt > STALE_MS;
    if (joinedStale) {
      updates[id] = null;
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(db, QUEUE_PATH), updates);
  }
}

function findOpponent(
  entries: Record<string, MatchmakingEntry>,
  playerId: string,
): [string, MatchmakingEntry] | null {
  const candidates = Object.entries(entries)
    .filter(([id, e]) => {
      if (id === "pairs" || typeof e !== "object" || !("joinedAt" in e)) return false;
      if (id === playerId) return false;
      if (e.roomCode) return false;
      if (e.matchedBy) return false;
      return true;
    })
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  return candidates[0] ?? null;
}

async function ensureInQueue(
  selfRef: ReturnType<typeof ref>,
  playerId: string,
  playerName: string,
  existing: MatchmakingEntry | null,
): Promise<MatchmakingEntry> {
  if (existing?.roomCode) return existing;

  if (existing?.matchedBy && !existing.roomCode) {
    if (
      existing.lockedAt &&
      Date.now() - existing.lockedAt > MATCH_LOCK_MS
    ) {
      await update(selfRef, { matchedBy: null, lockedAt: null });
      existing = { ...existing, matchedBy: null, lockedAt: null };
    } else {
      return existing;
    }
  }

  const entry: MatchmakingEntry = {
    name: playerName,
    joinedAt: existing?.joinedAt ?? Date.now(),
    roomCode: existing?.roomCode ?? null,
    matchedBy: null,
    lockedAt: null,
  };

  await update(selfRef, entry);
  await onDisconnect(selfRef).remove();
  return entry;
}

async function publishRoomCode(
  playerId: string,
  opponentId: string,
  roomCode: string,
): Promise<void> {
  const db = getDb();
  const patch = { roomCode, matchedBy: null, lockedAt: null };
  await update(ref(db, `${QUEUE_PATH}/${playerId}`), patch);
  await update(ref(db, `${QUEUE_PATH}/${opponentId}`), patch);
}

async function joinMatchmakingInternal(
  playerId: string,
  playerName: string,
): Promise<MatchResult> {
  const db = getDb();
  const selfRef = ref(db, `${QUEUE_PATH}/${playerId}`);

  const existingSnap = await get(selfRef);
  let existing = existingSnap.exists()
    ? (existingSnap.val() as MatchmakingEntry)
    : null;

  if (existing?.roomCode) {
    return { status: "matched", roomCode: existing.roomCode };
  }

  if (!existingSnap.exists()) {
    await set(selfRef, {
      name: playerName,
      joinedAt: Date.now(),
      roomCode: null,
      matchedBy: null,
      lockedAt: null,
    } satisfies MatchmakingEntry);
    await onDisconnect(selfRef).remove();
  } else {
    existing = await ensureInQueue(selfRef, playerId, playerName, existing);
    if (existing.matchedBy && !existing.roomCode) {
      return { status: "waiting" };
    }
    if (existing.roomCode) {
      return { status: "matched", roomCode: existing.roomCode };
    }
  }

  const queueSnap = await get(ref(db, QUEUE_PATH));
  if (!queueSnap.exists()) {
    return { status: "waiting" };
  }

  let entries = queueSnap.val() as Record<string, MatchmakingEntry>;
  await cleanupStaleEntries(entries);

  const freshSnap = await get(ref(db, QUEUE_PATH));
  if (!freshSnap.exists()) {
    return { status: "waiting" };
  }
  entries = freshSnap.val() as Record<string, MatchmakingEntry>;

  const selfEntry = entries[playerId];
  if (selfEntry?.roomCode) {
    return { status: "matched", roomCode: selfEntry.roomCode };
  }
  if (selfEntry?.matchedBy) {
    return { status: "waiting" };
  }

  const opponent = findOpponent(entries, playerId);
  if (!opponent) {
    return { status: "waiting" };
  }

  const [opponentId, opponentEntry] = opponent;

  const pairRef = ref(db, `${QUEUE_PATH}/pairs/${pairKey(playerId, opponentId)}`);
  const pairTx = await runTransaction(pairRef, (cur: { creatorId?: string; roomCode?: string } | null) => {
    if (cur?.roomCode) return cur;
    if (cur?.creatorId && cur.creatorId !== playerId) return cur;
    return { creatorId: playerId, createdAt: Date.now(), roomCode: null };
  });

  const pair = pairTx.snapshot.val() as { creatorId?: string; roomCode?: string } | null;
  if (pair?.roomCode) {
    await publishRoomCode(playerId, opponentId, pair.roomCode);
    return { status: "matched", roomCode: pair.roomCode };
  }
  if (!pair || pair.creatorId !== playerId) {
    return { status: "waiting" };
  }

  const opponentRef = ref(db, `${QUEUE_PATH}/${opponentId}`);
  const lockTx = await runTransaction(opponentRef, (data: MatchmakingEntry | null) => {
    if (!data || data.roomCode || data.matchedBy) return;
    return { ...data, matchedBy: playerId, lockedAt: Date.now() };
  });

  if (!lockTx.committed) {
    await remove(pairRef);
    return { status: "waiting" };
  }

  const locked = lockTx.snapshot.val() as MatchmakingEntry;
  if (locked.matchedBy !== playerId) {
    await remove(pairRef);
    return { status: "waiting" };
  }

  try {
    const roomCode = await createRoom(opponentId, opponentEntry.name, "random");
    const joined = await joinRoom(roomCode, playerId, playerName);
    if (!joined) {
      throw new Error("joinRoom failed");
    }

    await runTransaction(pairRef, (cur) =>
      cur ? { ...cur, roomCode } : cur,
    );
    await publishRoomCode(playerId, opponentId, roomCode);
    await onDisconnect(selfRef).cancel();
    await remove(pairRef);
    return { status: "matched", roomCode };
  } catch (err) {
    console.error("Matchmaking room creation failed:", err);
    await update(opponentRef, { matchedBy: null, lockedAt: null });
    await remove(pairRef);
    return { status: "waiting" };
  }
}

export async function joinMatchmaking(
  playerId: string,
  playerName: string,
): Promise<MatchResult> {
  return joinMatchmakingInternal(playerId, playerName);
}

export function subscribeMatchmaking(
  playerId: string,
  callback: (entry: MatchmakingEntry | null) => void,
): () => void {
  const db = getDb();
  const entryRef = ref(db, `${QUEUE_PATH}/${playerId}`);
  return onValue(entryRef, (snap) => {
    callback(snap.exists() ? (snap.val() as MatchmakingEntry) : null);
  });
}

export function subscribeMatchmakingQueue(
  onQueueChange: () => void,
): () => void {
  const db = getDb();
  return onValue(ref(db, QUEUE_PATH), () => onQueueChange());
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

  if (!data.matchedBy && !data.roomCode) {
    const queueSnap = await get(ref(db, QUEUE_PATH));
    if (queueSnap.exists()) {
      const entries = queueSnap.val() as Record<string, MatchmakingEntry>;
      for (const [id, e] of Object.entries(entries)) {
        if (id === "pairs") continue;
        if (e.matchedBy === playerId && !e.roomCode) {
          await update(ref(db, `${QUEUE_PATH}/${id}`), {
            matchedBy: null,
            lockedAt: null,
          });
        }
      }
    }
  }

  await onDisconnect(entryRef).cancel();
  await remove(entryRef);
}
