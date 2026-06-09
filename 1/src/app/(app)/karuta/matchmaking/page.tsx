"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  joinMatchmaking,
  leaveMatchmaking,
  subscribeMatchmaking,
} from "@/lib/matchmaking";
import BookLoading from "@/components/ui/BookLoading";

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
  const startedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!playerId || startedRef.current) return;
    startedRef.current = true;

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
        unsub = subscribeMatchmaking(playerId, (entry) => {
          if (entry?.roomCode) goToRoom(entry.roomCode).catch(console.error);
        });

        const result = await joinMatchmaking(playerId, playerName);
        if (result.status === "matched") {
          await goToRoom(result.roomCode);
          return;
        }

        retryInterval = setInterval(async () => {
          if (matchedRef.current) return;
          try {
            const r = await joinMatchmaking(playerId, playerName);
            if (r.status === "matched") {
              await goToRoom(r.roomCode);
            }
          } catch (err) {
            console.error("Matchmaking retry error:", err);
          }
        }, 3000);
      } catch (err) {
        console.error("Matchmaking start error:", err);
        setStatus("error");
        setError("Không thể tham gia hàng đợi. Kiểm tra kết nối Firebase.");
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
      <div className="glass-panel animate-scale-in text-center">
        {status === "searching" && (
          <>
            <BookLoading label="" size="lg" className="mb-4" />
            <h2 className="text-xl font-bold">
              Đang tìm đối thủ{dots}
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
              {playerName}
            </p>
          </>
        )}
        {status === "matched" && (
          <div className="py-4">
            <BookLoading label="Đang vào phòng..." />
          </div>
        )}
        {status === "error" && (
          <>
            <p className="text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/karuta")}
              className="btn-secondary mt-4"
            >
              Quay lại
            </button>
          </>
        )}
        {status === "searching" && (
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
