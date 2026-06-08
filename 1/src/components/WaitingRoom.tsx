"use client";

import type { Room } from "@/types/game";
import { setPlayerReady, startGame } from "@/lib/game";
import ScoreBoard from "./ScoreBoard";

interface WaitingRoomProps {
  room: Room;
  roomCode: string;
  playerId: string;
  role: "host" | "guest";
}

export default function WaitingRoom({
  room,
  roomCode,
  playerId,
  role,
}: WaitingRoomProps) {
  const isReady = role === "host" ? room.hostReady : room.guestReady;
  const opponentReady =
    role === "host" ? room.guestReady : room.hostReady;
  const hasGuest = !!room.guestId;
  const bothReady = room.hostReady && room.guestReady && hasGuest;

  const toggleReady = async () => {
    await setPlayerReady(roomCode, role, !isReady);
  };

  const handleStart = async () => {
    try {
      await startGame(roomCode);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể bắt đầu game");
    }
  };

  return (
    <div className="space-y-4">
      <ScoreBoard room={room} playerId={playerId} />

      <div className="glass-panel text-center">
        {room.matchType === "random" ? (
          <>
            <span className="inline-block rounded-full bg-warm-400/20 px-3 py-1 text-xs font-semibold text-warm-600 dark:bg-cold-400/20 dark:text-cold-300">
              Ghép ngẫu nhiên
            </span>
            <p className="mt-3 text-sm text-stone-500 dark:text-slate-400">
              Cả hai bấm Sẵn sàng để bắt đầu
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-stone-500">Mã phòng</p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.3em] text-warm-600 dark:text-cold-300">
              {roomCode}
            </p>
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PlayerStatus
          name={room.hostName}
          label="Chủ phòng"
          ready={room.hostReady}
          isYou={role === "host"}
        />
        <PlayerStatus
          name={room.guestName || "Chờ người chơi..."}
          label="Khách"
          ready={room.guestReady}
          isYou={role === "guest"}
          waiting={!hasGuest}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={toggleReady}
          disabled={role === "guest" && !hasGuest}
          className={isReady ? "btn-secondary" : "btn-primary"}
        >
          {isReady ? "Hủy sẵn sàng" : "Sẵn sàng"}
        </button>
        {role === "host" && (
          <button
            type="button"
            onClick={handleStart}
            disabled={!bothReady}
            className="btn-primary"
          >
            Bắt đầu!
          </button>
        )}
      </div>
    </div>
  );
}

function PlayerStatus({
  name,
  label,
  ready,
  isYou,
  waiting,
}: {
  name: string;
  label: string;
  ready: boolean;
  isYou: boolean;
  waiting?: boolean;
}) {
  return (
    <div
      className={`glass rounded-xl p-4 ${
        ready ? "ring-2 ring-emerald-400/50" : ""
      }`}
    >
      <p className="text-xs uppercase text-stone-400">{label}</p>
      <p className="mt-1 truncate font-semibold">
        {name}
        {isYou && (
          <span className="ml-1 text-xs text-warm-600 dark:text-cold-300">
            (Bạn)
          </span>
        )}
      </p>
      <p className="mt-2 text-sm text-stone-500">
        {waiting ? "⏳ Chờ..." : ready ? "✓ Sẵn sàng" : "○ Chưa sẵn sàng"}
      </p>
    </div>
  );
}
