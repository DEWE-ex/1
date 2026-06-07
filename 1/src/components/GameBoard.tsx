"use client";

import { useEffect, useState } from "react";
import type { Room } from "@/types/game";
import {
  getQuestionById,
  handleCardClick,
  startNextRound,
} from "@/lib/game";
import ScoreBoard from "./ScoreBoard";
import KarutaCard from "./KarutaCard";

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

  const isHost = playerId === room.hostId;
  const canPlay = room.roundState === "active" && !room.roundWinnerId;
  const roundWon = room.roundWinnerId === playerId;
  const roundLost =
    room.roundWinnerId && room.roundWinnerId !== playerId;

  useEffect(() => {
    if (!room.currentQuestionId) return;
    setLoadingClue(true);
    getQuestionById(room.currentQuestionId)
      .then((q) => setClue(q?.clue || ""))
      .finally(() => setLoadingClue(false));
  }, [room.currentQuestionId, room.currentRound]);

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
    await handleCardClick(roomCode, playerId, cardId);
  };

  if (room.status === "finished") {
    const won = room.gameWinnerId === playerId;
    const winnerName =
      room.gameWinnerId === room.hostId
        ? room.hostName
        : room.guestName;

    return (
      <div className="space-y-6">
        <ScoreBoard room={room} playerId={playerId} />
        <div className="card-panel text-center">
          <p className="text-6xl">{won ? "🏆" : "😔"}</p>
          <h2 className="mt-4 text-2xl font-bold">
            {won ? "Chiến thắng!" : "Thua cuộc"}
          </h2>
          <p className="mt-2 text-karuta-wood">
            {winnerName} thắng với tỷ số {room.hostScore} - {room.guestScore}
          </p>
          <a href="/" className="btn-primary mt-6 inline-block">
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScoreBoard room={room} playerId={playerId} />

      <div className="card-panel text-center">
        <p className="text-xs uppercase tracking-widest text-karuta-wood/60">
          Đọc câu / Gợi ý
        </p>
        {loadingClue ? (
          <p className="mt-3 animate-pulse text-xl text-karuta-wood/50">
            Đang tải...
          </p>
        ) : (
          <p className="mt-3 text-2xl font-bold leading-relaxed text-karuta-ink md:text-3xl">
            「{clue}」
          </p>
        )}
        <p className="mt-4 text-sm text-karuta-wood">
          Chạm vào thẻ đúng nhanh nhất!
        </p>
      </div>

      {roundWon && (
        <div className="rounded-xl bg-green-100 px-4 py-3 text-center font-semibold text-green-800">
          ✓ Bạn giành được điểm!
        </div>
      )}
      {roundLost && (
        <div className="rounded-xl bg-red-100 px-4 py-3 text-center font-semibold text-red-800">
          Đối thủ nhanh tay hơn!
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {room.cards.map((card) => {
          const showCorrect =
            room.roundState === "scored" && card.isCorrect;
          return (
            <KarutaCard
              key={card.id}
              text={card.text}
              onClick={() => onCardClick(card.id)}
              disabled={!canPlay}
              highlight={showCorrect ? "correct" : null}
            />
          );
        })}
      </div>
    </div>
  );
}
