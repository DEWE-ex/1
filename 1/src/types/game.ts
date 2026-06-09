export type QuestionStatus = "pending" | "approved" | "rejected";
export type QuestionCategory = "books" | "poetry";

export interface Question {
  id: string;
  clue: string;
  answer: string;
  contributedBy: string;
  createdAt: number;
  status: QuestionStatus;
  category: QuestionCategory;
}

export interface Card {
  id: string;
  text: string;
  isCorrect: boolean;
  removed?: boolean;
}

export type MatchType = "private" | "random";

export interface MatchmakingEntry {
  name: string;
  joinedAt: number;
  roomCode: string | null;
  matchedBy: string | null;
}

export interface Room {
  hostId: string;
  hostName: string;
  guestId: string | null;
  guestName: string | null;
  matchType?: MatchType;
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
  hostLockedUntil: number;
  guestLockedUntil: number;
  statsRecorded?: boolean;
  createdAt: number;
  maxScore: number;
  cardsPerRound: number;
  category: QuestionCategory;
}

export interface PlayerInfo {
  id: string;
  name: string;
  role: "host" | "guest";
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winRate: number;
  updatedAt: number;
}
