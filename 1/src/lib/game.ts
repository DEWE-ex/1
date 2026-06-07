import {
  ref,
  set,
  get,
  update,
  onValue,
  push,
  remove,
  runTransaction,
} from "firebase/database";
import { getDb } from "./firebase";
import type { Card, Question, Room } from "@/types/game";

export const WINNING_SCORE = 5;
export const CARDS_PER_ROUND = 6;

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generatePlayerId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function getAllQuestions(): Promise<Question[]> {
  const db = getDb();
  const snap = await get(ref(db, "questions"));
  if (!snap.exists()) return [];
  const data = snap.val() as Record<string, Omit<Question, "id">>;
  return Object.entries(data).map(([id, q]) => ({ id, ...q }));
}

export async function contributeQuestion(
  clue: string,
  answer: string,
  contributedBy: string
): Promise<string> {
  const db = getDb();
  const newRef = push(ref(db, "questions"));
  await set(newRef, {
    clue: clue.trim(),
    answer: answer.trim(),
    contributedBy: contributedBy.trim() || "Ẩn danh",
    createdAt: Date.now(),
  });
  return newRef.key!;
}

export async function createRoom(
  hostId: string,
  hostName: string
): Promise<string> {
  const db = getDb();
  let roomCode = generateRoomCode();
  let attempts = 0;

  while (attempts < 10) {
    const existing = await get(ref(db, `rooms/${roomCode}`));
    if (!existing.exists()) break;
    roomCode = generateRoomCode();
    attempts++;
  }

  const room: Room = {
    hostId,
    hostName,
    guestId: null,
    guestName: null,
    status: "waiting",
    hostScore: 0,
    guestScore: 0,
    hostReady: false,
    guestReady: false,
    currentRound: 0,
    roundState: "idle",
    currentQuestionId: null,
    cards: [],
    roundWinnerId: null,
    gameWinnerId: null,
    createdAt: Date.now(),
    maxScore: WINNING_SCORE,
  };

  await set(ref(db, `rooms/${roomCode}`), room);
  return roomCode;
}

export async function joinRoom(
  roomCode: string,
  guestId: string,
  guestName: string
): Promise<boolean> {
  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);

  const result = await runTransaction(roomRef, (room: Room | null) => {
    if (!room) return room;
    if (room.guestId && room.guestId !== guestId) return;
    if (room.status !== "waiting") return;
    return {
      ...room,
      guestId,
      guestName,
      guestReady: false,
    };
  });

  return result.committed;
}

export function subscribeRoom(
  roomCode: string,
  callback: (room: Room | null) => void
): () => void {
  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);
  return onValue(roomRef, (snap) => {
    callback(snap.exists() ? (snap.val() as Room) : null);
  });
}

export async function setPlayerReady(
  roomCode: string,
  role: "host" | "guest",
  ready: boolean
): Promise<void> {
  const db = getDb();
  const field = role === "host" ? "hostReady" : "guestReady";
  await update(ref(db, `rooms/${roomCode.toUpperCase()}`), { [field]: ready });
}

function buildRoundCards(questions: Question[], correct: Question): Card[] {
  const others = questions.filter((q) => q.id !== correct.id);
  const distractors = shuffle(others).slice(0, CARDS_PER_ROUND - 1);
  const cards: Card[] = [
    { id: correct.id, text: correct.answer, isCorrect: true },
    ...distractors.map((q) => ({
      id: q.id,
      text: q.answer,
      isCorrect: false,
    })),
  ];
  return shuffle(cards);
}

export async function startGame(roomCode: string): Promise<void> {
  const questions = await getAllQuestions();
  if (questions.length < CARDS_PER_ROUND) {
    throw new Error(
      `Cần ít nhất ${CARDS_PER_ROUND} câu hỏi. Hiện có ${questions.length}.`
    );
  }

  const correct = shuffle(questions)[0];
  const cards = buildRoundCards(questions, correct);

  const db = getDb();
  await update(ref(db, `rooms/${roomCode.toUpperCase()}`), {
    status: "playing",
    currentRound: 1,
    roundState: "active",
    currentQuestionId: correct.id,
    cards,
    roundWinnerId: null,
    gameWinnerId: null,
    hostReady: false,
    guestReady: false,
  });
}

export async function startNextRound(roomCode: string): Promise<void> {
  const questions = await getAllQuestions();
  if (questions.length < CARDS_PER_ROUND) return;

  const db = getDb();
  const roomSnap = await get(ref(db, `rooms/${roomCode.toUpperCase()}`));
  const room = roomSnap.val() as Room;
  const correct = shuffle(questions)[0];
  const cards = buildRoundCards(questions, correct);

  await update(ref(db, `rooms/${roomCode.toUpperCase()}`), {
    currentRound: room.currentRound + 1,
    roundState: "active",
    currentQuestionId: correct.id,
    cards,
    roundWinnerId: null,
  });
}

export async function handleCardClick(
  roomCode: string,
  playerId: string,
  cardId: string
): Promise<void> {
  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);

  await runTransaction(roomRef, (room: Room | null) => {
    if (!room || room.roundState !== "active" || room.roundWinnerId) {
      return room;
    }

    const card = room.cards.find((c) => c.id === cardId);
    if (!card) return room;

    if (!card.isCorrect) return room;

    const isHost = playerId === room.hostId;
    const newHostScore = isHost ? room.hostScore + 1 : room.hostScore;
    const newGuestScore = isHost ? room.guestScore : room.guestScore + 1;
    const gameOver =
      newHostScore >= room.maxScore || newGuestScore >= room.maxScore;

    return {
      ...room,
      roundState: "scored",
      roundWinnerId: playerId,
      hostScore: newHostScore,
      guestScore: newGuestScore,
      status: gameOver ? "finished" : "playing",
      gameWinnerId: gameOver
        ? newHostScore >= room.maxScore
          ? room.hostId
          : room.guestId
        : null,
    };
  });
}

export async function getQuestionById(
  questionId: string
): Promise<Question | null> {
  const db = getDb();
  const snap = await get(ref(db, `questions/${questionId}`));
  if (!snap.exists()) return null;
  return { id: questionId, ...snap.val() };
}

export async function leaveRoom(
  roomCode: string,
  playerId: string
): Promise<void> {
  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);
  const snap = await get(roomRef);
  if (!snap.exists()) return;

  const room = snap.val() as Room;
  if (room.hostId === playerId) {
    await remove(roomRef);
  } else if (room.guestId === playerId) {
    await update(roomRef, {
      guestId: null,
      guestName: null,
      guestReady: false,
      status: "waiting",
    });
  }
}

export async function seedDefaultQuestions(): Promise<number> {
  const db = getDb();
  const snap = await get(ref(db, "questions"));
  if (snap.exists() && Object.keys(snap.val()).length > 0) {
    return 0;
  }

  const defaults = [
    {
      clue: "Chim én về báo xuân đến",
      answer: "Xuân về chim én tìm về tổ",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Trăng sáng đêm rằm",
      answer: "Trăng rằm sáng như ban ngày",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Nước chảy đá mòn",
      answer: "Nước chảy đá mòn, kiên trì thành công",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Học thầy không học bạn",
      answer: "Học thầy không, học bạn có phải không",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Một cây làm chẳng nên non",
      answer: "Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Ăn quả nhớ kẻ trồng cây",
      answer: "Ăn quả nhớ kẻ trồng cây, uống nước nhớ nguồn",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Đi một ngày đàng",
      answer: "Đi một ngày đàng, học một sàng khôn",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Có công mài sắt",
      answer: "Có công mài sắt, có ngày nên kim",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Thương người như thể thương thân",
      answer: "Lòng ta thương người như thể thương thân",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Gần mực thì đen",
      answer: "Gần mực thì đen, gần đèn thì sáng",
      contributedBy: "Hệ thống",
    },
  ];

  for (const q of defaults) {
    const newRef = push(ref(db, "questions"));
    await set(newRef, { ...q, createdAt: Date.now() });
  }

  return defaults.length;
}
