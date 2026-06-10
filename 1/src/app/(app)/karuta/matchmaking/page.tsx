"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  joinMatchmaking,
  leaveMatchmaking,
  subscribeMatchmaking,
  subscribeMatchmakingQueue,
} from "@/lib/matchmaking";
import KarutaShell from "@/components/karuta/KarutaShell";
import MatchmakingPulse from "@/components/ui/MatchmakingPulse";
import { fadeInUp } from "@/lib/animations";

const RETRY_MS = 1200;

export default function MatchmakingPage() {
  const router = useRouter();
  const { playerId, user, displayName } = useAuth();
  const playerName =
    user?.displayName?.slice(0, 20) || displayName.slice(0, 20);

  const [status, setStatus] = useState<"searching" | "matched" | "error">(
    "searching",
  );
  const [error, setError] = useState("");
  const matchedRef = useRef(false);
  const startedRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!panelRef.current) return;
      fadeInUp(panelRef.current);
    },
    { scope: panelRef },
  );

  useEffect(() => {
    if (!playerId || startedRef.current) return;
    startedRef.current = true;

    let unsubEntry: (() => void) | undefined;
    let unsubQueue: (() => void) | undefined;
    let retryInterval: ReturnType<typeof setInterval> | undefined;

    const goToRoom = async (roomCode: string) => {
      if (matchedRef.current) return;
      matchedRef.current = true;
      setStatus("matched");
      if (retryInterval) clearInterval(retryInterval);
      unsubEntry?.();
      unsubQueue?.();

      gsap.to(panelRef.current, {
        scale: 1.02,
        duration: 0.3,
        ease: "back.out(1.5)",
      });

      await leaveMatchmaking(playerId);
      router.replace(`/karuta/room/${roomCode}`);
    };

    const tryMatch = async () => {
      if (matchedRef.current) return;
      try {
        const result = await joinMatchmaking(playerId, playerName);
        if (result.status === "matched") {
          await goToRoom(result.roomCode);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Permission denied") || msg.includes("PERMISSION_DENIED")) {
          setStatus("error");
          setError(
            "Firebase từ chối quyền truy cập. Hãy deploy database rules (xem hướng dẫn bên dưới).",
          );
          if (retryInterval) clearInterval(retryInterval);
        } else {
          console.error("Matchmaking retry error:", err);
        }
      }
    };

    const start = async () => {
      try {
        unsubEntry = subscribeMatchmaking(playerId, (entry) => {
          if (entry?.roomCode) goToRoom(entry.roomCode).catch(console.error);
        });

        unsubQueue = subscribeMatchmakingQueue(() => {
          tryMatch().catch(console.error);
        });

        await tryMatch();
        retryInterval = setInterval(tryMatch, RETRY_MS);
      } catch (err) {
        console.error("Matchmaking start error:", err);
        setStatus("error");
        setError("Không thể tham gia hàng đợi. Kiểm tra kết nối Firebase.");
      }
    };

    start();

    return () => {
      unsubEntry?.();
      unsubQueue?.();
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
    <KarutaShell>
      <div ref={panelRef} className="glass-panel text-center !py-6">
        {status === "searching" && (
          <>
            <MatchmakingPulse playerName={playerName} status="searching" />
            <h2 className="mt-10 text-base font-bold">Đang tìm đối thủ</h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
              Hệ thống ghép theo thứ tự vào hàng đợi
            </p>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary mt-6 w-full text-xs"
            >
              Hủy tìm trận
            </button>
          </>
        )}

        {status === "matched" && (
          <div className="py-2">
            <MatchmakingPulse playerName={playerName} status="matched" />
            <p className="mt-10 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Đã tìm thấy! Đang vào phòng...
            </p>
          </div>
        )}

        {status === "error" && (
          <>
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/karuta")}
              className="btn-secondary mt-4 w-full"
            >
              Quay lại
            </button>
          </>
        )}
      </div>
    </KarutaShell>
  );
}
