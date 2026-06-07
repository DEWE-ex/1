import { db, isFirebaseConfigured } from '../firebase';

export { isFirebaseConfigured };
import { ref, set, get, onValue, update, push } from 'firebase/database';

// Types
export interface Card {
  id: string;
  clue: string;
  answer: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  ready: boolean;
}

export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  players: Record<string, Player>;
  currentCardIndex: number;
  cards: Card[];
  winner: string | null;
  turnStartTime: number;
}

// Mock Data
let mockCards: Card[] = [
  { id: '1', clue: 'Thủ đô của Việt Nam là gì?', answer: 'Hà Nội' },
  { id: '2', clue: 'Loài vật lớn nhất trên Trái Đất?', answer: 'Cá voi xanh' },
  { id: '3', clue: 'Hành tinh gần Mặt Trời nhất?', answer: 'Sao Thủy' },
  { id: '4', clue: 'Tác giả của Truyện Kiều?', answer: 'Nguyễn Du' },
  { id: '5', clue: 'Ngọn núi cao nhất thế giới?', answer: 'Đỉnh Everest' },
  { id: '6', clue: 'Thành phố mang tên Bác?', answer: 'TP. Hồ Chí Minh' },
  { id: '7', clue: 'Châu lục lạnh nhất?', answer: 'Châu Nam Cực' },
  { id: '8', clue: 'Nước có diện tích lớn nhất thế giới?', answer: 'Nga' },
  { id: '9', clue: 'Loài chim không biết bay, sống ở Nam Cực?', answer: 'Chim cánh cụt' },
  { id: '10', clue: 'Ai là người phát minh ra bóng đèn sợi đốt?', answer: 'Thomas Edison' },
  { id: '11', clue: 'Đại dương lớn nhất Trái Đất?', answer: 'Thái Bình Dương' },
  { id: '12', clue: 'Châu lục đông dân nhất?', answer: 'Châu Á' },
];

// Load mock rooms from localStorage for persistence during testing
const loadMockRooms = (): Record<string, GameState> => {
  try {
    const saved = localStorage.getItem('karuta_mock_rooms');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveMockRooms = () => {
  try {
    localStorage.setItem('karuta_mock_rooms', JSON.stringify(mockRooms));
  } catch {
    // Ignore localStorage errors
  }
};

let mockRooms: Record<string, GameState> = loadMockRooms();
const listeners: Record<string, Function[]> = {};

const triggerListeners = (path: string, data: any) => {
  saveMockRooms(); // Persist changes
  if (listeners[path]) {
    listeners[path].forEach(cb => cb(data));
  }
};

// Functions
export const addCard = async (clue: string, answer: string): Promise<void> => {
  if (isFirebaseConfigured && db) {
    const cardsRef = ref(db, 'cards');
    const newCardRef = push(cardsRef);
    await set(newCardRef, { clue, answer });
  } else {
    const newCard = { id: Date.now().toString(), clue, answer };
    mockCards.push(newCard);
    console.log('Mock: Added card', newCard);
  }
};

export const getCards = async (): Promise<Card[]> => {
  if (isFirebaseConfigured && db) {
    const cardsRef = ref(db, 'cards');
    const snapshot = await get(cardsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
  } else {
    return [...mockCards];
  }
};

export const createRoom = async (playerName: string): Promise<{ roomId: string, playerId: string }> => {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const playerId = 'player_' + Date.now();
  
  const initialCards = await getCards();
  // Shuffle and take 10 cards for a game
  const shuffledCards = initialCards.sort(() => 0.5 - Math.random()).slice(0, 10);

  const newRoom: GameState = {
    status: 'waiting',
    players: {
      [playerId]: { id: playerId, name: playerName, score: 0, ready: true }
    },
    currentCardIndex: 0,
    cards: shuffledCards,
    winner: null,
    turnStartTime: 0
  };

  if (isFirebaseConfigured && db) {
    await set(ref(db, `rooms/${roomId}`), newRoom);
  } else {
    mockRooms[roomId] = newRoom;
    triggerListeners(`rooms/${roomId}`, newRoom);
  }

  return { roomId, playerId };
};

export const joinRoom = async (roomId: string, playerName: string): Promise<string> => {
  const playerId = 'player_' + Date.now();
  
  // Normalize room ID to uppercase
  const normalizedRoomId = roomId.toUpperCase().trim();
  
  if (isFirebaseConfigured && db) {
    const roomRef = ref(db, `rooms/${normalizedRoomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) throw new Error(`Room "${normalizedRoomId}" not found. Please check the Room ID.`);
    
    const room = snapshot.val() as GameState;
    if (Object.keys(room.players || {}).length >= 2) throw new Error('Room is full');
    if (room.status !== 'waiting') throw new Error('Game already started');

    await update(ref(db, `rooms/${normalizedRoomId}/players/${playerId}`), {
      id: playerId,
      name: playerName,
      score: 0,
      ready: true
    });
    
    // Auto start if 2 players
    const updatedSnapshot = await get(roomRef);
    const updatedRoom = updatedSnapshot.val() as GameState;
    if (Object.keys(updatedRoom.players).length === 2) {
      await update(ref(db, `rooms/${normalizedRoomId}`), {
        status: 'playing',
        turnStartTime: Date.now()
      });
    }
  } else {
    const room = mockRooms[normalizedRoomId];
    if (!room) throw new Error(`Room "${normalizedRoomId}" not found. Please check the Room ID or create a new room.`);
    if (Object.keys(room.players).length >= 2) throw new Error('Room is full');
    if (room.status !== 'waiting') throw new Error('Game already started');

    room.players[playerId] = { id: playerId, name: playerName, score: 0, ready: true };
    
    if (Object.keys(room.players).length === 2) {
      room.status = 'playing';
      room.turnStartTime = Date.now();
    }
    triggerListeners(`rooms/${normalizedRoomId}`, room);
  }

  return playerId;
};

export const subscribeToRoom = (roomId: string, callback: (state: GameState | null) => void) => {
  const normalizedRoomId = roomId.toUpperCase().trim();
  
  if (isFirebaseConfigured && db) {
    const roomRef = ref(db, `rooms/${normalizedRoomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() as GameState : null);
    });
    return () => unsubscribe();
  } else {
    const path = `rooms/${normalizedRoomId}`;
    if (!listeners[path]) listeners[path] = [];
    listeners[path].push(callback);
    callback(mockRooms[normalizedRoomId] || null);
    
    return () => {
      listeners[path] = listeners[path].filter(cb => cb !== callback);
    };
  }
};

export const submitAnswer = async (roomId: string, playerId: string, cardId: string) => {
  const normalizedRoomId = roomId.toUpperCase().trim();
  
  if (isFirebaseConfigured && db) {
    const roomRef = ref(db, `rooms/${normalizedRoomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;
    
    const room = snapshot.val() as GameState;
    if (room.status !== 'playing') return;
    
    const currentCard = room.cards[room.currentCardIndex];
    if (!currentCard || currentCard.id !== cardId) return; // Wrong answer or invalid state
    
    // Correct answer!
    const newScore = (room.players[playerId].score || 0) + 1;
    const nextIndex = room.currentCardIndex + 1;
    let newStatus: 'waiting' | 'playing' | 'finished' = room.status;
    let winner = room.winner;
    
    if (nextIndex >= room.cards.length) {
      newStatus = 'finished';
      // Determine winner
      const playerIds = Object.keys(room.players);
      let maxScore = -1;
      let winnerId = null;
      for (const id of playerIds) {
        const score = id === playerId ? newScore : room.players[id].score;
        if (score > maxScore) {
          maxScore = score;
          winnerId = id;
        } else if (score === maxScore) {
          winnerId = 'draw';
        }
      }
      winner = winnerId;
    }
    
    await update(roomRef, {
      [`players/${playerId}/score`]: newScore,
      currentCardIndex: nextIndex,
      status: newStatus,
      winner: winner,
      turnStartTime: Date.now()
    });
    
  } else {
    const room = mockRooms[normalizedRoomId];
    if (!room || room.status !== 'playing') return;
    
    const currentCard = room.cards[room.currentCardIndex];
    if (!currentCard || currentCard.id !== cardId) return;
    
    room.players[playerId].score += 1;
    room.currentCardIndex += 1;
    
    if (room.currentCardIndex >= room.cards.length) {
      room.status = 'finished';
      const playerIds = Object.keys(room.players);
      let maxScore = -1;
      let winnerId: string | null = null;
      for (const id of playerIds) {
        const score = room.players[id].score;
        if (score > maxScore) {
          maxScore = score;
          winnerId = id;
        } else if (score === maxScore) {
          winnerId = 'draw';
        }
      }
      room.winner = winnerId;
    } else {
      room.turnStartTime = Date.now();
    }
    
    triggerListeners(`rooms/${normalizedRoomId}`, { ...room });
  }
};
