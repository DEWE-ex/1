"use client";

import { memo, useRef, useEffect } from "react";
import type { Room } from "@/types/game";
import { scorePop } from "@/lib/animations";

interface ScoreBoardProps {
  room: Room;
  playerId: string;
}

function ScoreBoardInner({ room, playerId }: ScoreBoardProps) {
  const isHost = playerId === room.hostId;
  const hostScoreRef = useRef<HTMLSpanElement>(null);
  const guestScoreRef = useRef<HTMLSpanElement>(null);
  const prevHostScore = useRef(room.hostScore);
  const prevGuestScore = useRef(room.guestScore);

  useEffect(() => {
    if (room.hostScore !== prevHostScore.current && hostScoreRef.current) {
      scorePop(hostScoreRef.current);
    }
    prevHostScore.current = room.hostScore;
  }, [room.hostScore]);

  useEffect(() => {
    if (room.guestScore !== prevGuestScore.current && guestScoreRef.current) {
      scorePop(guestScoreRef.current);
    }
    prevGuestScore.current = room.guestScore;
  }, [room.guestScore]);

  return (
    <div className="glass flex items-center justify-between gap-2 rounded-xl px-3 py-2.5">
      <PlayerScore
        name={room.hostName}
        score={room.hostScore}
        maxScore={room.maxScore}
        isYou={isHost}
        align="left"
        scoreRef={hostScoreRef}
      />
      <div className="flex flex-col items-center px-1">
        <span className="text-[9px] uppercase tracking-wider text-stone-400">
          R{room.currentRound}
        </span>
        <span className="text-sm font-bold text-violet-500 dark:text-cold-400">
          VS
        </span>
      </div>
      <PlayerScore
        name={room.guestName || "Chờ..."}
        score={room.guestScore}
        maxScore={room.maxScore}
        isYou={!isHost && playerId === room.guestId}
        align="right"
        scoreRef={guestScoreRef}
      />
    </div>
  );
}

export default memo(ScoreBoardInner);

function PlayerScore({
  name,
  score,
  maxScore,
  isYou,
  align,
  scoreRef,
}: {
  name: string;
  score: number;
  maxScore: number;
  isYou: boolean;
  align: "left" | "right";
  scoreRef: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <div className={`min-w-0 flex-1 ${align === "right" ? "text-right" : ""}`}>
      <p className="truncate text-[11px] text-stone-600 dark:text-slate-300">
        {name}
        {isYou && (
          <span className="ml-1 rounded bg-violet-500/15 px-1 py-px text-[9px] text-violet-600 dark:text-cold-300">
            Bạn
          </span>
        )}
      </p>
      <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-white">
        <span ref={scoreRef}>{score}</span>
        <span className="text-sm font-normal text-stone-400">/{maxScore}</span>
      </p>
    </div>
  );
}
