"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import {
  createRoom,
  joinRoom,
  generatePlayerId,
  seedDefaultQuestions,
} from "@/lib/game";
import {
  getStoredPlayerId,
  getStoredPlayerName,
  setStoredPlayerId,
  setStoredPlayerName,
} from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState("");
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  useEffect(() => {
    setName(getStoredPlayerName());
    let id = getStoredPlayerId();
    if (!id) {
      id = generatePlayerId();
      setStoredPlayerId(id);
    }

    seedDefaultQuestions()
      .then((seeded) => {
        if (seeded > 0) setQuestionCount(seeded);
      })
      .catch(console.error);
  }, []);

  const validateName = () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return false;
    }
    setStoredPlayerName(name.trim());
    return true;
  };

  const handleCreate = async () => {
    if (!validateName()) return;
    setLoading("create");
    setError("");
    try {
      const playerId = getStoredPlayerId() || generatePlayerId();
      setStoredPlayerId(playerId);
      const code = await createRoom(playerId, name.trim());
      router.push(`/room/${code}`);
    } catch {
      setError("Không thể tạo phòng. Kiểm tra kết nối Firebase.");
    } finally {
      setLoading(null);
    }
  };

  const handleJoin = async () => {
    if (!validateName()) return;
    if (!joinCode.trim()) {
      setError("Vui lòng nhập mã phòng");
      return;
    }
    setLoading("join");
    setError("");
    try {
      const playerId = getStoredPlayerId() || generatePlayerId();
      setStoredPlayerId(playerId);
      const ok = await joinRoom(joinCode.trim(), playerId, name.trim());
      if (!ok) {
        setError("Không thể tham gia. Phòng đầy hoặc không tồn tại.");
        return;
      }
      router.push(`/room/${joinCode.trim().toUpperCase()}`);
    } catch {
      setError("Không thể tham gia phòng. Kiểm tra kết nối Firebase.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Header />

      <div className="mx-auto max-w-md space-y-6">
        <div className="card-panel">
          <label htmlFor="name" className="block text-sm font-medium text-karuta-wood">
            Tên của bạn
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên..."
            className="input-field mt-2"
            maxLength={20}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {questionCount !== null && questionCount > 0 && (
          <div className="rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
            Đã tải {questionCount} câu hỏi mặc định vào hệ thống.
          </div>
        )}

        <div className="card-panel space-y-4">
          <h2 className="text-lg font-bold">Tạo phòng mới</h2>
          <p className="text-sm text-karuta-wood/70">
            Tạo phòng và mời bạn bè bằng mã phòng
          </p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading !== null}
            className="btn-primary w-full"
          >
            {loading === "create" ? "Đang tạo..." : "Tạo phòng"}
          </button>
        </div>

        <div className="card-panel space-y-4">
          <h2 className="text-lg font-bold">Tham gia phòng</h2>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã phòng (VD: ABC123)"
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

        <div className="text-center">
          <a
            href="/contribute"
            className="text-sm font-medium text-karuta-red underline-offset-2 hover:underline"
          >
            Đóng góp câu hỏi mới →
          </a>
        </div>
      </div>
    </>
  );
}
