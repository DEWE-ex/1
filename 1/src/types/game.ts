export interface Question {
  id: string;
  clue: string;
  answer: string;
  contributedBy: string;
  createdAt: number;
}

export interface Card {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Room {
  hostId: string;
  hostName: string;
  guestId: string | null;
  guestName: string | null;
  status: "waiting" | "playing" | "finished";
  hostScore: number;
  guestScore: number;
  hostReady: boolean;
  guestReady: boolean;
  currentRound: number;
  roundState: "idle" | "active" | "scored";
  currentQuestionId: string | null;
  cards: Card[];
  roundWinnerId: string | null;
  gameWinnerId: string | null;
  createdAt: number;
  maxScore: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  role: "host" | "guest";
}
