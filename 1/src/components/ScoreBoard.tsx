import type { Room } from "@/types/game";

interface ScoreBoardProps {
  room: Room;
  playerId: string;
}

export default function ScoreBoard({ room, playerId }: ScoreBoardProps) {
  const isHost = playerId === room.hostId;

  return (
    <div className="glass flex items-stretch justify-between gap-4 rounded-2xl p-4">
      <PlayerScore
        name={room.hostName}
        score={room.hostScore}
        maxScore={room.maxScore}
        isYou={isHost}
        align="left"
      />
      <div className="flex flex-col items-center justify-center px-2">
        <span className="text-xs uppercase tracking-widest text-stone-400 dark:text-slate-500">
          Vòng {room.currentRound}
        </span>
        <span className="text-xl font-bold text-warm-600 dark:text-cold-300">
          VS
        </span>
      </div>
      <PlayerScore
        name={room.guestName || "Chờ..."}
        score={room.guestScore}
        maxScore={room.maxScore}
        isYou={!isHost && playerId === room.guestId}
        align="right"
      />
    </div>
  );
}

function PlayerScore({
  name,
  score,
  maxScore,
  isYou,
  align,
}: {
  name: string;
  score: number;
  maxScore: number;
  isYou: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={`flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
      <p className="truncate text-sm text-stone-600 dark:text-slate-300">
        {name}
        {isYou && (
          <span className="ml-1 rounded-full bg-warm-400/20 px-2 py-0.5 text-xs text-warm-600 dark:bg-cold-400/20 dark:text-cold-300">
            Bạn
          </span>
        )}
      </p>
      <p className="text-3xl font-bold text-stone-900 dark:text-white">
        {score}
        <span className="text-lg text-stone-400">/{maxScore}</span>
      </p>
    </div>
  );
}
