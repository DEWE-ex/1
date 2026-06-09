"use client";

import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Trophy, Frown, Book, ScrollText, Check } from "lucide-react";
import type { Card, Room } from "@/types/game";
import {
  getBookClues,
  getQuestionById,
  handleCardClick,
  startNextRound,
  WRONG_ANSWER_LOCK_MS,
} from "@/lib/game";
import { recordMatchResult } from "@/lib/leaderboard";
import { fadeInUp } from "@/lib/animations";
import {
  playKarutaCorrect,
  playKarutaRoundStart,
  playKarutaWin,
  playKarutaWrong,
} from "@/lib/sounds";
import ScoreBoard from "./ScoreBoard";
import KarutaCard from "./KarutaCard";
import BookLoading from "@/components/ui/BookLoading";

interface GameBoardProps {
  room: Room;
  roomCode: string;
  playerId: string;
}

function GameBoardInner({ room, roomCode, playerId }: GameBoardProps) {
  const [allClues, setAllClues] = useState<string[]>([]);
  const [visibleClueCount, setVisibleClueCount] = useState(1);
  const [loadingClue, setLoadingClue] = useState(false);
  const [wrongCardId, setWrongCardId] = useState<string | null>(null);
  const [ghostCard, setGhostCard] = useState<Card | null>(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const cluesRef = useRef<HTMLDivElement>(null);

  const isHost = playerId === room.hostId;
  const lockedUntil = isHost
    ? (room.hostLockedUntil ?? 0)
    : (room.guestLockedUntil ?? 0);
  const isLocked = lockedUntil > Date.now();

  const canPlay = useMemo(
    () => room.roundState === "active" && !room.roundWinnerId && !isLocked,
    [room.roundState, room.roundWinnerId, isLocked]
  );
  const roundWon = room.roundWinnerId === playerId;
  const roundLost = room.roundWinnerId && room.roundWinnerId !== playerId;

  const visibleCards = useMemo(() => {
    if (ghostCard && !room.cards.some((c) => c.id === ghostCard.id)) {
      return [...room.cards, ghostCard];
    }
    return room.cards;
  }, [room.cards, ghostCard]);

  const visibleClues = allClues.slice(0, visibleClueCount);
  const isBooks = room.category === "books";
  const hasMoreClues = isBooks && visibleClueCount < allClues.length;

  useGSAP(
    () => {
      const container = cluesRef.current;
      if (!container || visibleClues.length === 0) return;
      const last = container.lastElementChild;
      if (last) fadeInUp(last, { duration: 0.35 });
    },
    { dependencies: [visibleClueCount, room.currentRound], scope: boardRef }
  );

  const prevRoundRef = useRef(room.currentRound);

  useEffect(() => {
    if (!room.currentQuestionId) return;
    setLoadingClue(true);
    setWrongCardId(null);
    setGhostCard(null);
    setVisibleClueCount(1);
    getQuestionById(room.currentQuestionId)
      .then((q) => {
        if (!q) {
          setAllClues([]);
          return;
        }
        const clues =
          room.category === "books" ? getBookClues(q) : [q.clue].filter(Boolean);
        setAllClues(clues);
        if (room.currentRound !== prevRoundRef.current) {
          playKarutaRoundStart();
          prevRoundRef.current = room.currentRound;
        }
      })
      .finally(() => setLoadingClue(false));
  }, [room.currentQuestionId, room.currentRound, room.category]);

  useEffect(() => {
    if (!isBooks || allClues.length <= 1) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (allClues.length >= 2) {
      timers.push(setTimeout(() => setVisibleClueCount(2), 5000));
    }
    if (allClues.length >= 3) {
      timers.push(setTimeout(() => setVisibleClueCount(3), 10000));
    }
    return () => timers.forEach(clearTimeout);
  }, [allClues, room.currentQuestionId, isBooks]);

  useEffect(() => {
    if (!isLocked) {
      setLockSecondsLeft(0);
      return;
    }
    const tick = () =>
      setLockSecondsLeft(Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [isLocked, lockedUntil]);

  useEffect(() => {
    if (room.status === "finished" && !room.statsRecorded) {
      recordMatchResult(roomCode, room).catch(console.error);
    }
    if (room.roundState === "scored" && room.status !== "finished" && isHost) {
      const timer = setTimeout(() => {
        startNextRound(roomCode).catch(console.error);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [
    room.status,
    room.statsRecorded,
    room.roundState,
    room.currentRound,
    isHost,
    roomCode,
    room,
  ]);

  const onCardClick = useCallback(
    async (cardId: string) => {
      if (!canPlay) return;
      const picked = room.cards.find((c) => c.id === cardId);
      const result = await handleCardClick(roomCode, playerId, cardId);
      if (result === "correct" && picked) {
        playKarutaCorrect();
        setGhostCard(picked);
        setTimeout(() => setGhostCard(null), 380);
      } else if (result === "wrong") {
        playKarutaWrong();
        setWrongCardId(cardId);
        setTimeout(() => setWrongCardId(null), WRONG_ANSWER_LOCK_MS);
      }
    },
    [canPlay, roomCode, playerId, room.cards]
  );

  const prevStatusRef = useRef(room.status);

  useEffect(() => {
    if (room.status === "finished" && prevStatusRef.current !== "finished") {
      if (room.gameWinnerId === playerId) playKarutaWin();
    }
    prevStatusRef.current = room.status;
  }, [room.status, room.gameWinnerId, playerId]);

  if (room.status === "finished") {
    const won = room.gameWinnerId === playerId;
    const winnerName =
      room.gameWinnerId === room.hostId ? room.hostName : room.guestName;

    return (
      <div ref={boardRef} className="space-y-4">
        <ScoreBoard room={room} playerId={playerId} />
        <div className="glass-panel text-center !py-6">
          {won ? (
            <Trophy className="mx-auto h-12 w-12 text-amber-500" />
          ) : (
            <Frown className="mx-auto h-12 w-12 text-stone-400" />
          )}
          <h2 className="mt-3 text-xl font-bold">
            {won ? "Chiến thắng!" : "Thua cuộc"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {winnerName} · {room.hostScore}-{room.guestScore}
          </p>
          <a href="/karuta" className="btn-primary mt-5 inline-block text-sm">
            Về lobby
          </a>
        </div>
      </div>
    );
  }

  return (
    <div ref={boardRef} className="space-y-3">
      <ScoreBoard room={room} playerId={playerId} />

      <div className="glass-panel text-center !py-3">
        <p className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-400">
          {room.category === "poetry" ? (
            <>
              <ScrollText className="h-3 w-3" /> Văn thơ
            </>
          ) : (
            <>
              <Book className="h-3 w-3" /> Sách
            </>
          )}
        </p>
        {loadingClue ? (
          <div className="mt-2 flex justify-center">
            <BookLoading label="" size="sm" />
          </div>
        ) : (
          <div ref={cluesRef} className="mt-2 space-y-2">
            {visibleClues.map((text, i) => (
              <div key={`${room.currentRound}-${i}`}>
                {isBooks && allClues.length > 1 && (
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-500 dark:text-violet-300">
                    Gợi ý {i + 1}
                  </p>
                )}
                <p className="text-lg font-bold leading-relaxed text-slate-900 dark:text-white md:text-2xl">
                  「{text}」
                </p>
              </div>
            ))}
            {hasMoreClues && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Gợi ý tiếp sau 5 giây...
              </p>
            )}
          </div>
        )}
      </div>

      {isLocked && (
        <div className="rounded-xl bg-amber-500/10 px-3 py-2 text-center text-xs font-semibold text-amber-700 dark:text-amber-300">
          Sai! Chờ {lockSecondsLeft}s...
        </div>
      )}

      {roundWon && (
        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Check className="h-3.5 w-3.5" /> +1 điểm!
        </div>
      )}
      {roundLost && (
        <div className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs font-semibold text-red-700 dark:text-red-300">
          Đối thủ nhanh tay hơn!
        </div>
      )}

      <div className="mx-auto grid max-w-lg grid-cols-2 place-items-center gap-3 md:grid-cols-3">
        {visibleCards.map((card, idx) => (
          <KarutaCard
            key={`${room.currentRound}-${card.id}`}
            text={card.text}
            onClick={() => onCardClick(card.id)}
            disabled={!canPlay}
            highlight={
              ghostCard?.id === card.id
                ? "removing"
                : wrongCardId === card.id
                  ? "wrong"
                  : null
            }
            index={idx}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(GameBoardInner);
