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
import type {
  Card,
  MatchType,
  Question,
  QuestionStatus,
  Room,
} from "@/types/game";

export const WINNING_SCORE = 5;
export const CARDS_PER_ROUND = 6;
export const WRONG_ANSWER_LOCK_MS = 2000;

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

function normalizeQuestion(
  id: string,
  data: Omit<Question, "id"> & { status?: QuestionStatus }
): Question {
  return {
    id,
    clue: data.clue,
    answer: data.answer,
    contributedBy: data.contributedBy,
    createdAt: data.createdAt,
    status: data.status ?? "approved",
  };
}

export async function getAllQuestions(): Promise<Question[]> {
  const db = getDb();
  const snap = await get(ref(db, "questions"));
  if (!snap.exists()) return [];
  const data = snap.val() as Record<
    string,
    Omit<Question, "id"> & { status?: QuestionStatus }
  >;
  return Object.entries(data).map(([id, q]) => normalizeQuestion(id, q));
}

export async function getApprovedQuestions(): Promise<Question[]> {
  const all = await getAllQuestions();
  return all.filter((q) => q.status === "approved");
}

export async function getPendingQuestions(): Promise<Question[]> {
  const all = await getAllQuestions();
  return all.filter((q) => q.status === "pending");
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
    status: "pending",
  });
  return newRef.key!;
}

export async function createRoom(
  hostId: string,
  hostName: string,
  matchType: MatchType = "private"
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
    matchType,
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
    hostLockedUntil: 0,
    guestLockedUntil: 0,
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
  const questions = await getApprovedQuestions();
  if (questions.length < CARDS_PER_ROUND) {
    throw new Error(
      `Cần ít nhất ${CARDS_PER_ROUND} câu hỏi đã duyệt. Hiện có ${questions.length}.`
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
    hostLockedUntil: 0,
    guestLockedUntil: 0,
  });
}

export async function startNextRound(roomCode: string): Promise<void> {
  const questions = await getApprovedQuestions();
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
    hostLockedUntil: 0,
    guestLockedUntil: 0,
  });
}

export type CardClickResult = "correct" | "wrong" | "locked" | "ignored";

export async function handleCardClick(
  roomCode: string,
  playerId: string,
  cardId: string
): Promise<CardClickResult> {
  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);

  let result: CardClickResult = "ignored";

  await runTransaction(roomRef, (room: Room | null) => {
    if (!room || room.roundState !== "active" || room.roundWinnerId) {
      return room;
    }

    const isHost = playerId === room.hostId;
    const lockField = isHost ? "hostLockedUntil" : "guestLockedUntil";
    const now = Date.now();
    const lockedUntil = room[lockField] ?? 0;

    if (lockedUntil > now) {
      result = "locked";
      return room;
    }

    const card = room.cards.find((c) => c.id === cardId);
    if (!card) return room;

    if (!card.isCorrect) {
      result = "wrong";
      return { ...room, [lockField]: now + WRONG_ANSWER_LOCK_MS };
    }

    const newHostScore = isHost ? room.hostScore + 1 : room.hostScore;
    const newGuestScore = isHost ? room.guestScore : room.guestScore + 1;
    const gameOver =
      newHostScore >= room.maxScore || newGuestScore >= room.maxScore;

    result = "correct";
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

  return result;
}

export async function getQuestionById(
  questionId: string
): Promise<Question | null> {
  const db = getDb();
  const snap = await get(ref(db, `questions/${questionId}`));
  if (!snap.exists()) return null;
  return normalizeQuestion(questionId, snap.val());
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
      clue: "Cuốn tiểu thuyết bắt đầu bằng câu 'Call me Ishmael'",
      answer: "Moby-Dick",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Tác giả sáng tạo thế giới phù thủy Hogwarts",
      answer: "Harry Potter và Hòn đá Phù thủy",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Tiểu thuyết dystopia với Big Brother đang theo dõi",
      answer: "1984",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Câu chuyện tình giữa Elizabeth Bennet và Mr. Darcy",
      answer: "Kiêu hãnh và Định kiến",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Bộ ba phản diện Sauron, Gollum và chiếc nhẫn vàng",
      answer: "Chúa tể những chiếc nhẫn",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Tiểu thuyết khoa học viễn tưởng của Frank Herbert về sa mạc Arrakis",
      answer: "Dune",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Nhân vật chính là điệp viên mang mã số 007 trong loạt sách của Ian Fleming",
      answer: "James Bond",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Cuốn sách self-help nổi tiếng với thói quen 'thức dậy lúc 5 giờ sáng'",
      answer: "Thói quen buổi sáng của triệu phú",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Truyện tranh Nhật về nhân vật muốn trở thành Vua Hải Tặc",
      answer: "One Piece",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Tiểu thuyết của Dan Brown xoay quanh bí ẩn hội kín và mã Da Vinci",
      answer: "Mã Da Vinci",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Sách kể về chuyến phiêu lưu của Santiago tìm kho báu ở sa mạc",
      answer: "Nhà giả kim",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Tác phẩm của Haruki Murakami có nhân vật Toru Watanabe hồi tưởng về Naoko",
      answer: "Rừng Na Uy",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Cuốn sách dạy tư duy ngược và làm giàu của Robert Kiyosaki",
      answer: "Rich Dad Poor Dad",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Tiểu thuyết lịch sử Việt Nam của Nguyễn Huy Thiệp về làng Vĩ",
      answer: "Thời gian của một lối đi",
      contributedBy: "Hệ thống",
    },
    {
      clue: "Truyện ngắn kinh dị của Stephen King về khách sạn Overlook bị ám",
      answer: "The Shining",
      contributedBy: "Hệ thống",
    },
  ];

  for (const q of defaults) {
    const newRef = push(ref(db, "questions"));
    await set(newRef, {
      ...q,
      createdAt: Date.now(),
      status: "approved",
    });
  }

  return defaults.length;
}
