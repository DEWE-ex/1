"use client";

import { useEffect, useState } from "react";
import type { Room } from "@/types/game";
import {
  getQuestionById,
  handleCardClick,
  startNextRound,
  WRONG_ANSWER_LOCK_MS,
} from "@/lib/game";
import { recordMatchResult } from "@/lib/leaderboard";
import ScoreBoard from "./ScoreBoard";
import KarutaCard from "./KarutaCard";
import BookLoading from "@/components/ui/BookLoading";

interface GameBoardProps {
  room: Room;
  roomCode: string;
  playerId: string;
}

export default function GameBoard({
  room,
  roomCode,
  playerId,
}: GameBoardProps) {
  const [clue, setClue] = useState("");
  const [loadingClue, setLoadingClue] = useState(false);
  const [wrongCardId, setWrongCardId] = useState<string | null>(null);
  const [lockTick, setLockTick] = useState(0);

  const isHost = playerId === room.hostId;
  const lockedUntil = isHost
    ? (room.hostLockedUntil ?? 0)
    : (room.guestLockedUntil ?? 0);
  const isLocked = lockedUntil > Date.now();
  const lockSecondsLeft = isLocked
    ? Math.ceil((lockedUntil - Date.now()) / 1000)
    : 0;

  const canPlay =
    room.roundState === "active" && !room.roundWinnerId && !isLocked;
  const roundWon = room.roundWinnerId === playerId;
  const roundLost =
    room.roundWinnerId && room.roundWinnerId !== playerId;

  const visibleCards = room.cards.filter((c) => !c.removed);

  useEffect(() => {
    if (!room.currentQuestionId) return;
    setLoadingClue(true);
    setWrongCardId(null);
    getQuestionById(room.currentQuestionId)
      .then((q) => setClue(q?.clue || ""))
      .finally(() => setLoadingClue(false));
  }, [room.currentQuestionId, room.currentRound]);

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => setLockTick((t) => t + 1), 200);
    return () => clearInterval(timer);
  }, [isLocked, lockedUntil]);

  useEffect(() => {
    if (room.status === "finished" && !room.statsRecorded) {
      recordMatchResult(roomCode, room).catch(console.error);
    }
  }, [room.status, room.statsRecorded, roomCode, room]);

  useEffect(() => {
    if (room.roundState !== "scored" || room.status === "finished") return;
    if (!isHost) return;

    const timer = setTimeout(() => {
      startNextRound(roomCode).catch(console.error);
    }, 2500);

    return () => clearTimeout(timer);
  }, [room.roundState, room.status, room.currentRound, isHost, roomCode]);

  const onCardClick = async (cardId: string) => {
    if (!canPlay) return;

    const result = await handleCardClick(roomCode, playerId, cardId);

    if (result === "wrong") {
      setWrongCardId(cardId);
      setTimeout(() => setWrongCardId(null), WRONG_ANSWER_LOCK_MS);
    }
  };

  if (room.status === "finished") {
    const won = room.gameWinnerId === playerId;
    const winnerName =
      room.gameWinnerId === room.hostId
        ? room.hostName
        : room.guestName;

    return (
      <div className="animate-scale-in space-y-6">
        <ScoreBoard room={room} playerId={playerId} />
        <div className="glass-panel text-center">
          <p className="text-6xl">{won ? "🏆" : "😔"}</p>
          <h2 className="mt-4 text-2xl font-bold">
            {won ? "Chiến thắng!" : "Thua cuộc"}
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {winnerName} thắng với tỷ số {room.hostScore} - {room.guestScore}
          </p>
          <a href="/karuta" className="btn-primary mt-6 inline-block">
            Về lobby Karuta
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <ScoreBoard room={room} playerId={playerId} />

      <div className="glass-panel text-center">
        <p className="text-xs uppercase tracking-widest text-slate-400">
          {room.category === "poetry" ? "🎋 Văn thơ" : "📚 Sách"} · Vòng{" "}
          {room.currentRound}
        </p>
        {loadingClue ? (
          <div className="mt-4 flex justify-center">
            <BookLoading label="Đang tải câu hỏi..." size="sm" />
          </div>
        ) : (
          <p className="mt-3 animate-slide-up text-2xl font-bold leading-relaxed text-slate-900 dark:text-white md:text-3xl">
            「{clue}」
          </p>
        )}
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Chạm vào thẻ đúng nhanh nhất!
        </p>
      </div>

      {isLocked && (
        <div className="animate-slide-up rounded-xl bg-amber-100 px-4 py-3 text-center font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          Sai rồi! Chờ {lockSecondsLeft}s để chọn lại...
          <span className="hidden">{lockTick}</span>
        </div>
      )}

      {roundWon && (
        <div className="animate-scale-in rounded-xl bg-green-100 px-4 py-3 text-center font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-200">
          ✓ Bạn giành được điểm!
        </div>
      )}
      {roundLost && (
        <div className="animate-scale-in rounded-xl bg-red-100 px-4 py-3 text-center font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-200">
          Đối thủ nhanh tay hơn!
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {visibleCards.map((card, idx) => {
          const showCorrect =
            room.roundState === "scored" && card.isCorrect;
          const showWrong = wrongCardId === card.id;
          return (
            <KarutaCard
              key={card.id}
              text={card.text}
              onClick={() => onCardClick(card.id)}
              disabled={!canPlay}
              highlight={
                showCorrect ? "correct" : showWrong ? "wrong" : null
              }
              animationDelay={idx * 0.06}
            />
          );
        })}
      </div>
    </div>
  );
}
