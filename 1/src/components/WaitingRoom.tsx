"use client";

import { useState } from "react";
import type { QuestionCategory, Room } from "@/types/game";
import {
  setPlayerReady,
  startGame,
  updateRoomSettings,
  MIN_CARDS_PER_ROUND,
  MAX_CARDS_PER_ROUND,
} from "@/lib/game";
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
  const hasGuest = !!room.guestId;
  const bothReady = room.hostReady && room.guestReady && hasGuest;

  const [maxScore, setMaxScore] = useState(room.maxScore);
  const [cardsPerRound, setCardsPerRound] = useState(room.cardsPerRound);
  const [category, setCategory] = useState<QuestionCategory>(room.category);
  const [saving, setSaving] = useState(false);

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

  const handleSaveSettings = async () => {
    if (role !== "host") return;
    setSaving(true);
    try {
      await updateRoomSettings(roomCode, {
        maxScore,
        cardsPerRound,
        category,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <ScoreBoard room={room} playerId={playerId} />

      <div className="glass-panel text-center">
        {room.matchType === "random" ? (
          <>
            <span className="inline-block rounded-full bg-gradient-to-r from-violet-500/20 to-rose-500/20 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300">
              Ghép ngẫu nhiên
            </span>
            <p className="mt-3 text-sm text-stone-500 dark:text-slate-400">
              Cả hai bấm Sẵn sàng để bắt đầu
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-stone-500">Mã phòng</p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.3em] text-warm-600 dark:text-cold-300">
              {roomCode}
            </p>
          </>
        )}
      </div>

      {role === "host" && (
        <div className="glass-panel animate-slide-up space-y-4">
          <h3 className="font-bold text-stone-800 dark:text-slate-100">
            Cài đặt trận đấu
          </h3>

          <div>
            <label className="text-xs font-medium text-stone-500">
              Chủ đề câu hỏi
            </label>
            <div className="mt-2 flex gap-2">
              {(
                [
                  { value: "books", label: "📚 Sách" },
                  { value: "poetry", label: "🎋 Văn thơ" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    category === opt.value
                      ? "bg-gradient-to-r from-violet-500 to-rose-500 text-white"
                      : "glass"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-stone-500">
                Số điểm thắng: {maxScore}
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="mt-1 w-full accent-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500">
                Số đáp án/vòng: {cardsPerRound}
              </label>
              <input
                type="range"
                min={MIN_CARDS_PER_ROUND}
                max={MAX_CARDS_PER_ROUND}
                value={cardsPerRound}
                onChange={(e) => setCardsPerRound(Number(e.target.value))}
                className="mt-1 w-full accent-rose-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="btn-secondary w-full text-sm"
          >
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
        </div>
      )}

      {role === "guest" && (
        <div className="glass-panel text-sm text-stone-600 dark:text-slate-300">
          <p>
            Chủ đề:{" "}
            <strong>
              {room.category === "poetry" ? "Văn thơ" : "Sách"}
            </strong>
          </p>
          <p>
            Điểm thắng: <strong>{room.maxScore}</strong> · Đáp án/vòng:{" "}
            <strong>{room.cardsPerRound}</strong>
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
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
      className={`glass animate-card-in rounded-xl p-4 ${
        ready ? "ring-2 ring-emerald-400/50" : ""
      }`}
    >
      <p className="text-xs uppercase text-stone-400">{label}</p>
      <p className="mt-1 truncate font-semibold">
        {name}
        {isYou && (
          <span className="ml-1 text-xs text-warm-600 dark:text-cold-300">
            (Bạn)
          </span>
        )}
      </p>
      <p className="mt-2 text-sm text-stone-500">
        {waiting ? "⏳ Chờ..." : ready ? "✓ Sẵn sàng" : "○ Chưa sẵn sàng"}
      </p>
    </div>
  );
}
