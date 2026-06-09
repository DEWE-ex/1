"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import WaitingRoom from "@/components/WaitingRoom";
import GameBoard from "@/components/GameBoard";
import { subscribeRoom, leaveRoom } from "@/lib/game";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Room, PlayerInfo } from "@/types/game";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { playerId } = useAuth();
  const roomCode = (params.code as string).toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;

    const unsub = subscribeRoom(roomCode, (r) => {
      setRoom(r);
      setLoading(false);
      if (!r) return;
      if (r.hostId === playerId) {
        setPlayer({ id: playerId, name: r.hostName, role: "host" });
      } else if (r.guestId === playerId) {
        setPlayer({ id: playerId, name: r.guestName!, role: "guest" });
      }
    });

    return () => unsub();
  }, [roomCode, playerId]);

  useEffect(() => {
    if (!loading && !room) router.replace("/karuta");
  }, [loading, room, router]);

  const handleLeave = async () => {
    if (player) await leaveRoom(roomCode, player.id);
    router.push("/karuta");
  };

  if (loading || !room || !player) {
    return (
      <div className="glass-panel mx-auto max-w-lg text-center">
        <p className="animate-pulse text-stone-500">Đang kết nối phòng...</p>
      </div>
    );
  }

  const isPlaying = room.status === "playing" || room.status === "finished";

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-1">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleLeave}
          className="text-sm text-stone-500 hover:underline dark:text-slate-400"
        >
          Rời phòng
        </button>
      </div>
      {isPlaying ? (
        <GameBoard room={room} roomCode={roomCode} playerId={player.id} />
      ) : (
        <WaitingRoom
          room={room}
          roomCode={roomCode}
          playerId={player.id}
          role={player.role}
        />
      )}
    </div>
  );
}
