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
    <div className="space-y-6">
      <ScoreBoard room={room} playerId={playerId} />

      <div className="card-panel text-center">
        <p className="text-sm text-karuta-wood">Mã phòng</p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-[0.3em] text-karuta-red">
          {roomCode}
        </p>
        <p className="mt-4 text-sm text-karuta-wood/70">
          Chia sẻ mã này cho đối thủ
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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

      {isReady && !opponentReady && hasGuest && (
        <p className="text-center text-sm text-karuta-wood">
          Đang chờ đối thủ sẵn sàng...
        </p>
      )}
      {!hasGuest && role === "host" && (
        <p className="text-center text-sm text-karuta-wood">
          Đang chờ đối thủ tham gia...
        </p>
      )}
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
      className={`rounded-xl border-2 p-4 ${
        ready
          ? "border-green-400 bg-green-50"
          : "border-karuta-gold/30 bg-white"
      }`}
    >
      <p className="text-xs uppercase text-karuta-wood/60">{label}</p>
      <p className="mt-1 truncate font-semibold">
        {name}
        {isYou && (
          <span className="ml-1 text-xs text-karuta-red">(Bạn)</span>
        )}
      </p>
      <p className="mt-2 text-sm">
        {waiting
          ? "⏳ Chờ..."
          : ready
            ? "✓ Sẵn sàng"
            : "○ Chưa sẵn sàng"}
      </p>
    </div>
  );
}
