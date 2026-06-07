import type { Room } from "@/types/game";

interface ScoreBoardProps {
  room: Room;
  playerId: string;
}

export default function ScoreBoard({ room, playerId }: ScoreBoardProps) {
  const isHost = playerId === room.hostId;

  return (
    <div className="flex items-stretch justify-between gap-4 rounded-xl bg-karuta-ink p-4 text-white">
      <PlayerScore
        name={room.hostName}
        score={room.hostScore}
        maxScore={room.maxScore}
        isYou={isHost}
        align="left"
      />
      <div className="flex flex-col items-center justify-center px-2">
        <span className="text-xs uppercase tracking-widest text-karuta-gold">
          Vòng {room.currentRound}
        </span>
        <span className="text-2xl font-bold text-karuta-gold">VS</span>
      </div>
      <PlayerScore
        name={room.guestName || "Đang chờ..."}
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
      <p className="truncate text-sm text-white/70">
        {name}
        {isYou && (
          <span className="ml-1 rounded bg-karuta-gold/20 px-1.5 py-0.5 text-xs text-karuta-gold">
            Bạn
          </span>
        )}
      </p>
      <p className="text-3xl font-bold">
        {score}
        <span className="text-lg text-white/40">/{maxScore}</span>
      </p>
    </div>
  );
}
