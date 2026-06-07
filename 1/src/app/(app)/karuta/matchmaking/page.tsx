"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  joinMatchmaking,
  leaveMatchmaking,
  subscribeMatchmaking,
} from "@/lib/matchmaking";

export default function MatchmakingPage() {
  const router = useRouter();
  const { playerId, user, displayName } = useAuth();
  const playerName =
    user?.displayName?.slice(0, 20) || displayName.slice(0, 20);

  const [status, setStatus] = useState<"searching" | "matched" | "error">(
    "searching"
  );
  const [error, setError] = useState("");
  const [dots, setDots] = useState("");
  const matchedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!playerId) return;

    let unsub: (() => void) | undefined;
    let retryInterval: ReturnType<typeof setInterval> | undefined;

    const goToRoom = async (roomCode: string) => {
      if (matchedRef.current) return;
      matchedRef.current = true;
      setStatus("matched");
      if (retryInterval) clearInterval(retryInterval);
      unsub?.();
      await leaveMatchmaking(playerId);
      router.replace(`/karuta/room/${roomCode}`);
    };

    const start = async () => {
      try {
        const result = await joinMatchmaking(playerId, playerName);
        if (result.status === "matched") {
          await goToRoom(result.roomCode);
          return;
        }

        unsub = subscribeMatchmaking(playerId, (entry) => {
          if (entry?.roomCode) goToRoom(entry.roomCode).catch(console.error);
        });

        retryInterval = setInterval(() => {
          joinMatchmaking(playerId, playerName)
            .then((r) => {
              if (r.status === "matched")
                goToRoom(r.roomCode).catch(console.error);
            })
            .catch(console.error);
        }, 3000);
      } catch {
        setStatus("error");
        setError("Không thể tham gia hàng đợi.");
      }
    };

    start();

    return () => {
      unsub?.();
      if (retryInterval) clearInterval(retryInterval);
      if (!matchedRef.current) leaveMatchmaking(playerId).catch(console.error);
    };
  }, [playerId, playerName, router]);

  const handleCancel = async () => {
    matchedRef.current = true;
    if (playerId) await leaveMatchmaking(playerId);
    router.push("/karuta");
  };

  return (
    <div className="mx-auto max-w-md p-1">
      <div className="glass-panel text-center">
        {status === "searching" && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-warm-200/50 dark:bg-cold-800/50">
              <div className="h-10 w-10 animate-ping rounded-full bg-warm-400/50 dark:bg-cold-400/50" />
            </div>
            <h2 className="text-xl font-bold">
              Đang tìm đối thủ{dots}
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
              {playerName}
            </p>
          </>
        )}
        {status === "matched" && (
          <p className="text-lg font-semibold">Đang vào phòng...</p>
        )}
        {status === "error" && (
          <p className="text-red-500">{error}</p>
        )}
        {status !== "matched" && (
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary mt-8 w-full"
          >
            Hủy tìm trận
          </button>
        )}
      </div>
    </div>
  );
}
