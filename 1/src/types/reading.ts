export interface ReadingSession {
  id: string;
  bookTitle: string;
  durationMinutes: number;
  completedAt: number;
  pageNumber?: number;
}

export interface ReadingStats {
  totalMinutes: number;
  longestSessionMinutes: number;
  sessions: ReadingSession[];
  unlockedAchievements: string[];
  updatedAt: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Tổng phút đọc tích lũy cần đạt */
  totalMinutes?: number;
  /** Phút trong một phiên cần đạt */
  sessionMinutes?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "starter_15",
    name: "Khởi đầu",
    description: "Hoàn thành phiên đọc 15 phút",
    emoji: "🌱",
    sessionMinutes: 15,
  },
  {
    id: "focus_30",
    name: "Tập trung",
    description: "Hoàn thành phiên đọc 30 phút",
    emoji: "📖",
    sessionMinutes: 30,
  },
  {
    id: "marathon_60",
    name: "Kiên trì",
    description: "Hoàn thành phiên đọc 60 phút",
    emoji: "🏅",
    sessionMinutes: 60,
  },
  {
    id: "total_60",
    name: "Một giờ vàng",
    description: "Tích lũy 1 giờ đọc sách",
    emoji: "⭐",
    totalMinutes: 60,
  },
  {
    id: "total_300",
    name: "Mọt sách",
    description: "Tích lũy 5 giờ đọc sách",
    emoji: "👑",
    totalMinutes: 300,
  },
  {
    id: "total_600",
    name: "Tri thức",
    description: "Tích lũy 10 giờ đọc sách",
    emoji: "🎓",
    totalMinutes: 600,
  },
];
