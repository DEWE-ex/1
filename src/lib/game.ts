import {
  ref,
  set,
  get,
  update,
  onValue,
  push,
  remove,
  runTransaction,
  onDisconnect,
} from "firebase/database";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "./firebase";
import type {
  Card,
  MatchType,
  Question,
  QuestionCategory,
  QuestionStatus,
  Room,
} from "@/types/game";

export const DEFAULT_WINNING_SCORE = 5;
export const DEFAULT_CARDS_PER_ROUND = 6;
export const MIN_CARDS_PER_ROUND = 3;
export const MAX_CARDS_PER_ROUND = 12;
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
  return `p_${uuidv4()}`;
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
  data: Omit<Question, "id"> & {
    status?: QuestionStatus;
    category?: QuestionCategory;
    extraClues?: string[] | null;
  },
): Question {
  const extraClues = (data.extraClues ?? [])
    .map((c) => c?.trim())
    .filter(Boolean)
    .slice(0, 2);
  return {
    id,
    clue: data.clue,
    extraClues: extraClues.length > 0 ? extraClues : undefined,
    answer: data.answer,
    contributedBy: data.contributedBy,
    createdAt: data.createdAt,
    status: data.status ?? "approved",
    category: data.category ?? "books",
  };
}

export function getBookClues(question: Question): string[] {
  return [question.clue, ...(question.extraClues ?? [])]
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function getAllQuestions(): Promise<Question[]> {
  const db = getDb();
  const snap = await get(ref(db, "questions"));
  if (!snap.exists()) return [];
  const data = snap.val() as Record<
    string,
    Omit<Question, "id"> & {
      status?: QuestionStatus;
      category?: QuestionCategory;
    }
  >;
  return Object.entries(data).map(([id, q]) => normalizeQuestion(id, q));
}

export async function getApprovedQuestions(
  category?: QuestionCategory,
): Promise<Question[]> {
  const all = await getAllQuestions();
  return all.filter(
    (q) => q.status === "approved" && (!category || q.category === category),
  );
}

export async function getPendingQuestions(): Promise<Question[]> {
  const all = await getAllQuestions();
  return all.filter((q) => q.status === "pending");
}

export async function contributeQuestion(
  clue: string,
  answer: string,
  contributedBy: string,
  category: QuestionCategory = "books",
  extraClues: string[] = [],
): Promise<string> {
  const db = getDb();
  const newRef = push(ref(db, "questions"));
  const trimmedExtra =
    category === "books"
      ? extraClues.map((c) => c.trim()).filter(Boolean).slice(0, 2)
      : [];
  await set(newRef, {
    clue: clue.trim(),
    extraClues: trimmedExtra.length > 0 ? trimmedExtra : null,
    answer: answer.trim(),
    contributedBy: contributedBy.trim() || "Ẩn danh",
    createdAt: Date.now(),
    status: "pending",
    category,
  });
  return newRef.key!;
}

export async function createRoom(
  hostId: string,
  hostName: string,
  matchType: MatchType = "private",
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
    retiredCardIds: [],
    roundWinnerId: null,
    gameWinnerId: null,
    hostLockedUntil: 0,
    guestLockedUntil: 0,
    createdAt: Date.now(),
    maxScore: DEFAULT_WINNING_SCORE,
    cardsPerRound: DEFAULT_CARDS_PER_ROUND,
    category: "books",
  };

  const code = roomCode.toUpperCase();
  await set(ref(db, `rooms/${code}`), room);
  return code;
}

export async function updateRoomSettings(
  roomCode: string,
  settings: {
    maxScore?: number;
    cardsPerRound?: number;
    category?: QuestionCategory;
  },
): Promise<void> {
  const db = getDb();
  const updates: Partial<Room> = {};
  if (settings.maxScore !== undefined) {
    updates.maxScore = Math.min(20, Math.max(1, settings.maxScore));
  }
  if (settings.cardsPerRound !== undefined) {
    updates.cardsPerRound = Math.min(
      MAX_CARDS_PER_ROUND,
      Math.max(MIN_CARDS_PER_ROUND, settings.cardsPerRound),
    );
  }
  if (settings.category !== undefined) {
    updates.category = settings.category;
  }
  await update(ref(db, `rooms/${roomCode.toUpperCase()}`), updates);
}

export async function joinRoom(
  roomCode: string,
  guestId: string,
  guestName: string,
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

export function attachRoomDisconnectHandler(
  roomCode: string,
  role: "host" | "guest",
  hasPartner: boolean,
): Promise<() => Promise<void>> {
  const db = getDb();
  const code = roomCode.toUpperCase();
  const disconnects = [] as ReturnType<typeof onDisconnect>[];

  if (!hasPartner) {
    disconnects.push(onDisconnect(ref(db, `rooms/${code}`)));
  } else if (role === "host") {
    disconnects.push(onDisconnect(ref(db, `rooms/${code}/hostId`)));
    disconnects.push(onDisconnect(ref(db, `rooms/${code}/hostName`)));
    disconnects.push(onDisconnect(ref(db, `rooms/${code}/hostReady`)));
    disconnects.push(onDisconnect(ref(db, `rooms/${code}/hostLockedUntil`)));
  } else {
    disconnects.push(onDisconnect(ref(db, `rooms/${code}/guestId`)));
    disconnects.push(onDisconnect(ref(db, `rooms/${code}/guestName`)));
    disconnects.push(onDisconnect(ref(db, `rooms/${code}/guestReady`)));
    disconnects.push(onDisconnect(ref(db, `rooms/${code}/guestLockedUntil`)));
  }

  return Promise.all(disconnects.map((d) => d.remove())).then(() => {
    return async () => {
      await Promise.all(disconnects.map((d) => d.cancel()));
    };
  });
}

export async function promoteGuestToHost(
  roomCode: string,
  guestId: string,
): Promise<void> {
  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);
  await runTransaction(roomRef, (room: Room | null) => {
    if (!room) return room;
    if (room.hostId || room.guestId !== guestId) return room;

    return {
      ...room,
      hostId: room.guestId,
      hostName: room.guestName ?? room.guestId,
      guestId: null,
      guestName: null,
      hostReady: false,
      guestReady: false,
      status: "waiting",
    };
  });
}

export function subscribeRoom(
  roomCode: string,
  callback: (room: Room | null) => void,
): () => void {
  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);
  return onValue(roomRef, (snap) => {
    const room = snap.exists() ? (snap.val() as Room) : null;
    if (room) {
      callback({
        ...room,
        maxScore: room.maxScore ?? DEFAULT_WINNING_SCORE,
        cardsPerRound: room.cardsPerRound ?? DEFAULT_CARDS_PER_ROUND,
        category: room.category ?? "books",
        retiredCardIds: room.retiredCardIds ?? [],
      });
    } else {
      callback(null);
    }
  });
}

export async function setPlayerReady(
  roomCode: string,
  role: "host" | "guest",
  ready: boolean,
): Promise<void> {
  const db = getDb();
  const field = role === "host" ? "hostReady" : "guestReady";
  await update(ref(db, `rooms/${roomCode.toUpperCase()}`), { [field]: ready });
}

/** Mỗi thẻ là đáp án của một câu hỏi trong pool — giữ nguyên suốt trận, chỉ biến mất khi trả lời đúng. */
function buildGameCards(questions: Question[]): Card[] {
  return shuffle(
    questions.map((q) => ({
      id: q.id,
      text: q.answer,
      isCorrect: false,
    })),
  );
}

function pickNextQuestionId(
  cards: Card[],
  excludeId?: string | null,
): string | null {
  const ids = cards.map((c) => c.id);
  const pool =
    excludeId && ids.length > 1
      ? ids.filter((id) => id !== excludeId)
      : ids;
  if (pool.length === 0) return null;
  return shuffle(pool)[0];
}

export async function startGame(roomCode: string): Promise<void> {
  const db = getDb();
  const roomSnap = await get(ref(db, `rooms/${roomCode.toUpperCase()}`));
  const room = roomSnap.val() as Room;
  const category = room.category ?? "books";
  const cardsPerRound = room.cardsPerRound ?? DEFAULT_CARDS_PER_ROUND;

  const questions = await getApprovedQuestions(category);
  if (questions.length < cardsPerRound) {
    throw new Error(
      `Cần ít nhất ${cardsPerRound} câu hỏi chủ đề "${category === "books" ? "Sách" : "Văn thơ"}". Hiện có ${questions.length}.`,
    );
  }

  const pool = shuffle(questions).slice(0, cardsPerRound);
  const cards = buildGameCards(pool);
  const firstQuestionId = pickNextQuestionId(cards);

  await update(ref(db, `rooms/${roomCode.toUpperCase()}`), {
    status: "playing",
    currentRound: 1,
    roundState: "active",
    currentQuestionId: firstQuestionId,
    cards,
    retiredCardIds: [],
    roundWinnerId: null,
    gameWinnerId: null,
    hostReady: false,
    guestReady: false,
    hostLockedUntil: 0,
    guestLockedUntil: 0,
  });
}

function determineWinner(room: Room): string | null {
  if (room.hostScore > room.guestScore) return room.hostId;
  if (room.guestScore > room.hostScore) return room.guestId;
  // Hòa → người ghi bàn cuối thắng
  return room.roundWinnerId;
}

export async function startNextRound(roomCode: string): Promise<void> {
  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);

  await runTransaction(roomRef, (room: Room | null) => {
    if (!room || room.status === "finished" || room.roundState !== "scored") {
      return room;
    }

    const maxScore = room.maxScore ?? DEFAULT_WINNING_SCORE;
    if (room.hostScore >= maxScore || room.guestScore >= maxScore) {
      const winnerId = room.hostScore >= maxScore ? room.hostId : room.guestId;
      return { ...room, status: "finished", gameWinnerId: winnerId };
    }

    const remainingCards = room.cards ?? [];
    if (remainingCards.length === 0) {
      return {
        ...room,
        status: "finished",
        gameWinnerId: determineWinner(room),
      };
    }

    const nextQuestionId = pickNextQuestionId(
      remainingCards,
      room.currentQuestionId,
    );
    if (!nextQuestionId) {
      return room;
    }

    return {
      ...room,
      currentRound: room.currentRound + 1,
      roundState: "active",
      currentQuestionId: nextQuestionId,
      roundWinnerId: null,
      hostLockedUntil: 0,
      guestLockedUntil: 0,
    };
  });
}

export type CardClickResult = "correct" | "wrong" | "locked" | "ignored";

export async function handleCardClick(
  roomCode: string,
  playerId: string,
  cardId: string,
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

    const card = room.cards.find((c) => c.id === cardId && !c.removed);
    if (!card) return room;

    const isCorrect = cardId === room.currentQuestionId;
    if (!isCorrect) {
      result = "wrong";
      return { ...room, [lockField]: now + WRONG_ANSWER_LOCK_MS };
    }

    const retiredCardIds = [...(room.retiredCardIds ?? []), cardId];
    const updatedCards = room.cards.filter((c) => c.id !== cardId);

    const newHostScore = isHost ? room.hostScore + 1 : room.hostScore;
    const newGuestScore = isHost ? room.guestScore : room.guestScore + 1;
    const maxScore = room.maxScore ?? DEFAULT_WINNING_SCORE;
    const reachedMax = newHostScore >= maxScore || newGuestScore >= maxScore;
    const noCardsLeft = updatedCards.length === 0;
    const gameOver = reachedMax || noCardsLeft;

    let winnerId: string | null = null;
    if (gameOver) {
      if (newHostScore > newGuestScore) winnerId = room.hostId;
      else if (newGuestScore > newHostScore) winnerId = room.guestId;
      else winnerId = playerId; // Hòa → người ghi bàn cuối thắng
    }

    result = "correct";
    return {
      ...room,
      cards: updatedCards,
      retiredCardIds,
      roundState: "scored",
      roundWinnerId: playerId,
      hostScore: newHostScore,
      guestScore: newGuestScore,
      status: gameOver ? "finished" : "playing",
      gameWinnerId: winnerId,
    };
  });

  return result;
}

export async function getQuestionById(
  questionId: string,
): Promise<Question | null> {
  const db = getDb();
  const snap = await get(ref(db, `questions/${questionId}`));
  if (!snap.exists()) return null;
  return normalizeQuestion(questionId, snap.val());
}

export async function leaveRoom(
  roomCode: string,
  playerId: string,
): Promise<void> {
  const db = getDb();
  const roomRef = ref(db, `rooms/${roomCode.toUpperCase()}`);

  await runTransaction(roomRef, (room: Room | null) => {
    if (!room) return room;

    if (room.hostId === playerId) {
      if (!room.guestId) {
        return null;
      }

      return {
        ...room,
        hostId: room.guestId,
        hostName: room.guestName ?? room.guestId,
        guestId: null,
        guestName: null,
        hostReady: false,
        guestReady: false,
        status: "waiting",
      };
    }

    if (room.guestId === playerId) {
      return {
        ...room,
        guestId: null,
        guestName: null,
        guestReady: false,
        status: "waiting",
      };
    }

    return room;
  });
}

export async function seedDefaultQuestions(): Promise<number> {
  const db = getDb();
  const snap = await get(ref(db, "questions"));
  if (snap.exists() && Object.keys(snap.val()).length > 0) {
    return 0;
  }

  const defaults: Array<{
    clue: string;
    extraClues?: string[];
    answer: string;
    contributedBy: string;
    category: QuestionCategory;
  }> = [
    {
      clue: "Cuốn tiểu thuyết bắt đầu bằng câu 'Call me Ishmael'",
      extraClues: [
        "Tác giả Herman Melville, kể về săn cá voi trên biển",
        "Con cá voi trắng khổng lồ tên Moby Dick",
      ],
      answer: "Moby-Dick",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Tác giả sáng tạo thế giới phù thủy Hogwarts",
      extraClues: [
        "Nhân vật chính mang sẹo hình tia chớp trên trán",
        "Cuốn đầu tiên trong series gồm 7 tập",
      ],
      answer: "Harry Potter và Hòn đá Phù thủy",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Tiểu thuyết dystopia với Big Brother đang theo dõi",
      extraClues: [
        "Tác giả George Orwell, xuất bản năm 1949",
        "Khẩu hiệu 'War is Peace, Freedom is Slavery'",
      ],
      answer: "1984",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Câu chuyện tình giữa Elizabeth Bennet và Mr. Darcy",
      extraClues: [
        "Tác giả Jane Austen, bối cảnh nước Anh thế kỷ 19",
        "Tiểu thuyết mở đầu: 'It is a truth universally acknowledged...'",
      ],
      answer: "Kiêu hãnh và Định kiến",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Bộ ba phản diện Sauron, Gollum và chiếc nhẫn vàng",
      extraClues: [
        "Tác giả J.R.R. Tolkien, bộ ba gồm 3 tập",
        "Hành trình hủy Chiếc Nhẫn Quyền lực tại Mount Doom",
      ],
      answer: "Chúa tể những chiếc nhẫn",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Tiểu thuyết khoa học viễn tưởng của Frank Herbert về sa mạc Arrakis",
      extraClues: [
        "Gia tộc Atreides và gia vị melange quý hiếm",
        "Nhân vật Paul Atreides được gọi là Muad'Dib",
      ],
      answer: "Dune",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Nhân vật chính là điệp viên mang mã số 007 trong loạt sách của Ian Fleming",
      extraClues: [
        "Tên đầy đủ James Bond, làm việc cho MI6",
        "Thích martini 'shaken, not stirred'",
      ],
      answer: "James Bond",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Cuốn sách self-help nổi tiếng với thói quen 'thức dậy lúc 5 giờ sáng'",
      extraClues: [
        "Tác giả Hal Elrod",
        "Viết tắt SAVERS: Silence, Affirmations, Visualization...",
      ],
      answer: "Thói quen buổi sáng của triệu phú",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Truyện tranh Nhật về nhân vật muốn trở thành Vua Hải Tặc",
      extraClues: [
        "Tác giả Eiichiro Oda, nhân vật chính đội mũ rơm",
        "Tên nhân vật là Monkey D. Luffy",
      ],
      answer: "One Piece",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Tiểu thuyết của Dan Brown xoay quanh bí ẩn hội kín và mã Da Vinci",
      extraClues: [
        "Nhân vật Robert Langdon là giáo sư biểu tượng học",
        "Bí ẩn xoay quanh bức tranh The Last Supper",
      ],
      answer: "Mã Da Vinci",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Sách kể về chuyến phiêu lưu của Santiago tìm kho báu ở sa mạc",
      extraClues: [
        "Tác giả Paulo Coelho, xuất bản năm 1988",
        "Câu chuyện về chàng chăn cừu người Tây Ban Nha",
      ],
      answer: "Nhà giả kim",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Tác phẩm của Haruki Murakami có nhân vật Toru Watanabe hồi tưởng về Naoko",
      extraClues: [
        "Bối cảnh Tokyo những năm 1960",
        "Tiêu đề gợi đến một loài cây lá kim",
      ],
      answer: "Rừng Na Uy",
      contributedBy: "Hệ thống",
      category: "books",
    },
    {
      clue: "Bài thơ mở đầu: 'Trăng lên đầu cây / Hoa bưởi nở trắng cành'",
      answer: "Trăng lên",
      contributedBy: "Hệ thống",
      category: "poetry",
    },
    {
      clue: "Câu thơ: 'Tôi là ai? / Giọt sương trên lá sen'",
      answer: "Tôi là ai",
      contributedBy: "Hệ thống",
      category: "poetry",
    },
    {
      clue: "Bài thơ Tố Hữu: 'Ai về Bắc Lệ Thủy / Cho gửi về quê ngoại'",
      answer: "Ai về Bắc Lệ Thủy",
      contributedBy: "Hệ thống",
      category: "poetry",
    },
    {
      clue: "Câu thơ Xuân Diệu: 'Ta muốn sống dài để yêu lâu / Ta muốn chết đi để không bao giờ phải xa em'",
      answer: "Sóng",
      contributedBy: "Hệ thống",
      category: "poetry",
    },
    {
      clue: "Bài thơ Hàn Mặc Tử: 'Em còn nhớ hay em quên rồi / Một chiều phố nhỏ mưa bay'",
      answer: "Em còn nhớ hay em quên rồi",
      contributedBy: "Hệ thống",
      category: "poetry",
    },
    {
      clue: "Câu thơ Chế Lan Viên: 'Sau tất cả ta là những kẻ lạc loài'",
      answer: "Sau tất cả",
      contributedBy: "Hệ thống",
      category: "poetry",
    },
  ];

  for (const q of defaults) {
    const newRef = push(ref(db, "questions"));
    const { extraClues, ...rest } = q;
    await set(newRef, {
      ...rest,
      extraClues: extraClues?.length ? extraClues : null,
      createdAt: Date.now(),
      status: "approved",
    });
  }

  return defaults.length;
}
