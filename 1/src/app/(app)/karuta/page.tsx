"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Users, Hash, Zap } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  createRoom,
  joinRoom,
  seedDefaultQuestions,
} from "@/lib/game";

export default function KarutaPage() {
  const router = useRouter();
  const { playerId, displayName, user } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | "match" | null>(
    null
  );
  const [error, setError] = useState("");

  const playerName =
    user?.displayName?.slice(0, 20) || displayName.slice(0, 20);

  useEffect(() => {
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
    <div className="mx-auto max-w-lg space-y-4 p-1">
      <div className="glass-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-warm-400 to-warm-500 dark:from-cold-500 dark:to-cold-600">
            <Gamepad2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-white">
              Karuta 1 vs 1
            </h1>
            <p className="text-sm text-stone-500 dark:text-slate-400">
              Chơi với tư cách <strong>{playerName}</strong>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="glass-panel space-y-3">
        <div className="flex items-center gap-2 text-warm-600 dark:text-cold-300">
          <Zap className="h-5 w-5" />
          <h2 className="font-bold">Ghép ngẫu nhiên</h2>
        </div>
        <p className="text-sm text-stone-500 dark:text-slate-400">
          Tự động tìm đối thủ online
        </p>
        <button
          type="button"
          onClick={handleMatchmaking}
          disabled={loading !== null}
          className="btn-primary w-full"
        >
          {loading === "match" ? "Đang vào hàng đợi..." : "Tìm trận ngay"}
        </button>
      </div>

      <div className="glass-panel space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-stone-600 dark:text-slate-300" />
          <h2 className="font-bold">Tạo phòng</h2>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading !== null}
          className="btn-primary w-full"
        >
          {loading === "create" ? "Đang tạo..." : "Tạo phòng mới"}
        </button>
      </div>

      <div className="glass-panel space-y-3">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-stone-600 dark:text-slate-300" />
          <h2 className="font-bold">Tham gia phòng</h2>
        </div>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Mã phòng (ABC123)"
          className="input-field font-mono tracking-widest"
          maxLength={6}
        />
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading !== null}
          className="btn-secondary w-full"
        >
          {loading === "join" ? "Đang tham gia..." : "Tham gia"}
        </button>
      </div>
    </div>
  );
}
