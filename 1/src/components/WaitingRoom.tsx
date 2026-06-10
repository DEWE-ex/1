"use client";

import { useState, useEffect, memo } from "react";
import { Book, ScrollText, Clock, Check, Circle } from "lucide-react";
import type { QuestionCategory, Room } from "@/types/game";
import {
  setPlayerReady,
  startGame,
  updateRoomSettings,
  MIN_CARDS_PER_ROUND,
  MAX_CARDS_PER_ROUND,
} from "@/lib/game";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import ScoreBoard from "./ScoreBoard";

interface WaitingRoomProps {
  room: Room;
  roomCode: string;
  playerId: string;
  role: "host" | "guest";
}

function WaitingRoomInner({
  room,
  roomCode,
  playerId,
  role,
}: WaitingRoomProps) {
  const isReady = role === "host" ? room.hostReady : room.guestReady;
  const hasGuest = !!room.guestId;
  const bothReady = room.hostReady && room.guestReady && hasGuest;
  const pageRef = useGsapReveal<HTMLDivElement>("stagger");

  const [maxScore, setMaxScore] = useState(room.maxScore);
  const [cardsPerRound, setCardsPerRound] = useState(room.cardsPerRound);
  const [category, setCategory] = useState<QuestionCategory>(room.category);
  const [saving, setSaving] = useState(false);

  // Tự động bắt đầu game trong phòng matchmaking (ghép ngẫu nhiên) khi cả hai đã sẵn sàng
  useEffect(() => {
    if (bothReady && room.matchType === "random" && role === "host") {
      handleStart();
    }
  }, [bothReady, room.matchType, role]);

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
      await updateRoomSettings(roomCode, { maxScore, cardsPerRound, category });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={pageRef} className="space-y-2.5">
      <div data-reveal-item>
        <ScoreBoard room={room} playerId={playerId} />
      </div>

      <div data-reveal-item className="glass-panel text-center !py-3">
        {room.matchType === "random" ? (
          <>
            <span className="inline-block rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-300">
              Ghép ngẫu nhiên
            </span>
            <p className="mt-2 text-xs text-stone-500 dark:text-slate-400">
              Cả hai bấm Sẵn sàng để bắt đầu
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase text-stone-400">Mã phòng</p>
            <p className="mt-0.5 font-mono text-3xl font-bold tracking-[0.25em] text-violet-600 dark:text-cold-300">
              {roomCode}
            </p>
          </>
        )}
      </div>

      {role === "host" && (
        <div data-reveal-item className="glass-panel space-y-3 !p-3">
          <h3 className="text-sm font-bold">Cài đặt</h3>

          <div className="flex gap-1.5">
            {(
              [
                { value: "books", label: "Sách", icon: Book },
                { value: "poetry", label: "Văn thơ", icon: ScrollText },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                  category === opt.value
                    ? "bg-gradient-to-r from-violet-500 to-rose-500 text-white"
                    : "glass"
                }`}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-[10px] text-stone-500">
              Điểm thắng: {maxScore}
              <input
                type="range"
                min={1}
                max={20}
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="mt-0.5 w-full accent-violet-500"
              />
            </label>
            <label className="text-[10px] text-stone-500">
              Đáp án/vòng: {cardsPerRound}
              <input
                type="range"
                min={MIN_CARDS_PER_ROUND}
                max={MAX_CARDS_PER_ROUND}
                value={cardsPerRound}
                onChange={(e) => setCardsPerRound(Number(e.target.value))}
                className="mt-0.5 w-full accent-rose-500"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="btn-secondary w-full text-xs"
          >
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
        </div>
      )}

      {role === "guest" && (
        <div
          data-reveal-item
          className="glass-panel text-xs text-stone-600 dark:text-slate-300 !p-3"
        >
          {room.category === "poetry" ? "Văn thơ" : "Sách"} · {room.maxScore} điểm
          · {room.cardsPerRound} đáp án
        </div>
      )}

      <div data-reveal-item className="grid grid-cols-2 gap-2">
        <PlayerStatus
          name={room.hostName}
          label="Chủ phòng"
          ready={room.hostReady}
          isYou={role === "host"}
        />
        <PlayerStatus
          name={room.guestName || "Chờ..."}
          label="Khách"
          ready={room.guestReady}
          isYou={role === "guest"}
          waiting={!hasGuest}
        />
      </div>

      <div data-reveal-item className="flex gap-2">
        <button
          type="button"
          onClick={toggleReady}
          disabled={role === "guest" && !hasGuest}
          className={`flex-1 text-sm ${isReady ? "btn-secondary" : "btn-primary"}`}
        >
          {isReady ? "Hủy sẵn sàng" : "Sẵn sàng"}
        </button>
        {role === "host" && (
          <button
            type="button"
            onClick={handleStart}
            disabled={!bothReady}
            className="btn-primary flex-1 text-sm"
          >
            Bắt đầu
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(WaitingRoomInner);

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
      className={`glass rounded-xl p-2.5 ${
        ready ? "ring-1 ring-emerald-400/60" : ""
      }`}
    >
      <p className="text-[9px] uppercase text-stone-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">
        {name}
        {isYou && (
          <span className="ml-1 text-[9px] text-violet-500 dark:text-cold-400">
            (Bạn)
          </span>
        )}
      </p>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-stone-500">
        {waiting ? (
          <>
            <Clock className="h-3 w-3" /> Chờ
          </>
        ) : ready ? (
          <>
            <Check className="h-3 w-3 text-emerald-500" /> Sẵn sàng
          </>
        ) : (
          <>
            <Circle className="h-3 w-3" /> Chưa
          </>
        )}
      </p>
    </div>
  );
}
