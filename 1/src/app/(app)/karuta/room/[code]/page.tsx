"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { attachRoomDisconnectHandler, leaveRoom, promoteGuestToHost, subscribeRoom } from "@/lib/game";
import { useAuth } from "@/components/providers/AuthProvider";
import KarutaShell from "@/components/karuta/KarutaShell";
import BookLoading from "@/components/ui/BookLoading";
import type { Room, PlayerInfo } from "@/types/game";

const WaitingRoom = dynamic(() => import("@/components/WaitingRoom"), {
  loading: () => (
    <div className="flex justify-center py-8">
      <BookLoading label="Đang tải phòng..." size="sm" />
    </div>
  ),
});

const GameBoard = dynamic(() => import("@/components/GameBoard"), {
  loading: () => (
    <div className="flex justify-center py-8">
      <BookLoading label="Đang tải game..." size="sm" />
    </div>
  ),
});

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
    if (!room || !player) return;

    const hasPartner =
      player.role === "host" ? Boolean(room.guestId) : Boolean(room.hostId);

    let cancelled = false;
    let cancelHandler: (() => Promise<void>) | null = null;

    attachRoomDisconnectHandler(roomCode, player.role, hasPartner)
      .then((cancel) => {
        if (!cancelled) {
          cancelHandler = cancel;
        } else {
          cancel().catch(() => {});
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      if (cancelHandler) {
        cancelHandler().catch(console.error);
      }
    };
  }, [roomCode, player?.id, player?.role, player, room]);

  useEffect(() => {
    if (!room || !player || player.role !== "guest") return;
    if (!room.hostId && room.guestId === player.id) {
      promoteGuestToHost(roomCode, player.id).catch(console.error);
    }
  }, [room, player, roomCode]);

  useEffect(() => {
    if (!loading && !room) router.replace("/karuta");
  }, [loading, room, router]);

  const handleLeave = async () => {
    if (player) await leaveRoom(roomCode, player.id);
    router.push("/karuta");
  };

  if (loading || !room || !player) {
    return (
      <KarutaShell size="wide">
        <div className="glass-panel flex justify-center py-12">
          <BookLoading label="Đang kết nối phòng..." size="sm" />
        </div>
      </KarutaShell>
    );
  }

  const isPlaying = room.status === "playing" || room.status === "finished";

  return (
    <KarutaShell wide>
      <div className="space-y-2">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleLeave}
            className="text-xs text-stone-500 hover:text-stone-700 dark:text-slate-400"
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
    </KarutaShell>
  );
}
