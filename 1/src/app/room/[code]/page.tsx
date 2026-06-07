"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import WaitingRoom from "@/components/WaitingRoom";
import GameBoard from "@/components/GameBoard";
import { subscribeRoom, leaveRoom } from "@/lib/game";
import { getStoredPlayerId } from "@/lib/storage";
import type { Room } from "@/types/game";
import type { PlayerInfo } from "@/types/game";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string).toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const playerId = getStoredPlayerId();
    if (!playerId) {
      router.replace("/");
      return;
    }

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
  }, [roomCode, router]);

  useEffect(() => {
    if (!loading && !room) {
      router.replace("/");
    }
  }, [loading, room, router]);

  const handleLeave = async () => {
    if (player) {
      await leaveRoom(roomCode, player.id);
    }
    router.push("/");
  };

  if (loading || !room || !player) {
    return (
      <>
        <Header />
        <div className="card-panel text-center">
          <p className="animate-pulse text-karuta-wood">Đang kết nối phòng...</p>
        </div>
      </>
    );
  }

  const isPlaying = room.status === "playing" || room.status === "finished";

  return (
    <>
      <Header />
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleLeave}
          className="text-sm text-karuta-wood underline-offset-2 hover:underline"
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
    </>
  );
}
