"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gamepad2,
  Users,
  Hash,
  Zap,
  Trophy,
  PlusCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { createRoom, joinRoom, seedDefaultQuestions } from "@/lib/game";
import KarutaShell from "@/components/karuta/KarutaShell";
import { useGsapReveal } from "@/hooks/useGsapReveal";

export default function KarutaPage() {
  const router = useRouter();
  const { playerId, displayName, user, isGuest } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | "match" | null>(
    null
  );
  const [error, setError] = useState("");
  const pageRef = useGsapReveal<HTMLDivElement>("stagger");
  const seededRef = useRef(false);

  const playerName =
    user?.displayName?.slice(0, 20) || displayName.slice(0, 20);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    seedDefaultQuestions().catch(console.error);
  }, []);

  const handleCreate = async () => {
    if (!playerId) return;
    setLoading("create");
    setError("");
    try {
      const code = await createRoom(playerId, playerName);
      router.push(`/karuta/room/${code}`);
    } catch {
      setError("Không thể tạo phòng.");
    } finally {
      setLoading(null);
    }
  };

  const handleMatchmaking = () => {
    setLoading("match");
    router.push("/karuta/matchmaking");
  };

  const handleJoin = async () => {
    if (!playerId || !joinCode.trim()) {
      setError("Nhập mã phòng");
      return;
    }
    setLoading("join");
    setError("");
    try {
      const ok = await joinRoom(joinCode.trim(), playerId, playerName);
      if (!ok) {
        setError("Phòng đầy hoặc không tồn tại.");
        return;
      }
      router.push(`/karuta/room/${joinCode.trim().toUpperCase()}`);
    } catch {
      setError("Không thể tham gia phòng.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <KarutaShell size="lobby">
      <div ref={pageRef} className="space-y-4">
        <div data-reveal-item className="glass-panel !p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-rose-500 shadow-glow dark:from-cold-500 dark:to-violet-600 dark:shadow-glow-cold">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-stone-900 dark:text-white md:text-3xl">
                Karuta 1v1
              </h1>
              <p className="mt-0.5 truncate text-sm text-stone-500 dark:text-slate-400">
                Chơi với tư cách <strong>{playerName}</strong>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div
            data-reveal-item
            className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          data-reveal-item
          onClick={handleMatchmaking}
          disabled={loading !== null}
          className="group w-full rounded-2xl bg-gradient-to-r from-violet-500 via-warm-400 to-rose-500 p-5 text-left shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 dark:from-cold-500 dark:via-violet-500 dark:to-cyan-500 dark:shadow-glow-cold"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-7 w-7 text-white" />
              <div>
                <p className="text-lg font-bold text-white">Tìm trận ngay</p>
                <p className="text-sm text-white/80">Ghép ngẫu nhiên online</p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-white/70 transition group-hover:translate-x-1" />
          </div>
          {loading === "match" && (
            <p className="mt-2 text-xs text-white/60">Đang vào hàng đợi...</p>
          )}
        </button>

        <div data-reveal-item className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading !== null}
            className="glass-panel !p-5 text-left transition hover:bg-white/60 active:scale-[0.98] disabled:opacity-50 dark:hover:bg-cold-800/40"
          >
            <Users className="h-6 w-6 text-violet-500 dark:text-cold-400" />
            <p className="mt-3 text-base font-semibold">Tạo phòng</p>
            <p className="text-sm text-stone-500 dark:text-slate-400">
              {loading === "create" ? "Đang tạo..." : "Mời bạn bè"}
            </p>
          </button>
          <Link
            href="/karuta/leaderboard"
            className="glass-panel !p-5 transition hover:bg-white/60 dark:hover:bg-cold-800/40"
          >
            <Trophy className="h-6 w-6 text-amber-500" />
            <p className="mt-3 text-base font-semibold">Xếp hạng</p>
            <p className="text-sm text-stone-500 dark:text-slate-400">
              Top người chơi
            </p>
          </Link>
        </div>

        <div data-reveal-item className="glass-panel space-y-3 !p-5">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-stone-500" />
            <span className="text-base font-semibold">Tham gia bằng mã</span>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="input-field !py-3 text-center font-mono text-lg tracking-[0.25em]"
              maxLength={6}
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={loading !== null}
              className="btn-secondary shrink-0 !px-6 !py-3 text-base"
            >
              {loading === "join" ? "..." : "Vào"}
            </button>
          </div>
        </div>

        {!isGuest && (
          <Link
            href="/karuta/contribute"
            data-reveal-item
            className="flex items-center justify-center gap-2 py-2 text-sm text-stone-500 transition hover:text-violet-500 dark:text-slate-400 dark:hover:text-cold-400"
          >
            <PlusCircle className="h-4 w-4" />
            Đóng góp câu hỏi
          </Link>
        )}
      </div>
    </KarutaShell>
  );
}
