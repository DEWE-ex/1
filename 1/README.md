# BookFinder

Ứng dụng web **gợi ý sách bằng AI**, **cộng đồng chia sẻ**, **đồng hồ đọc sách** và game **Karuta 1v1** realtime.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Firebase Realtime Database · Google Gemini · GSAP

---

## Chạy dự án

```bash
cp .env.example .env.local   # điền biến môi trường
npm install
npm run dev                  # http://localhost:3000
```

Chi tiết cấu hình Firebase: [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)

---

## Cấu trúc thư mục

```
bookfinder/
├── docs/                  # Tài liệu hướng dẫn
├── patches/               # Patch npm (dom-exception)
├── src/
│   ├── app/               # Next.js App Router (pages + API)
│   ├── components/      # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Logic nghiệp vụ, Firebase, AI
│   └── types/             # TypeScript interfaces
├── .env.example           # Mẫu biến môi trường
├── next.config.ts         # Cấu hình Next.js + redirects
├── tailwind.config.ts     # Theme Tailwind (warm/cold)
├── tsconfig.json          # Cấu hình TypeScript
└── package.json           # Dependencies & scripts
```

---

## `src/app/` — Trang & API routes

### Layout gốc

| File | Chức năng |
|------|-----------|
| `layout.tsx` | Layout HTML gốc, bọc `ThemeProvider`, `AuthProvider`, `GsapProvider` |
| `globals.css` | Style toàn cục: glass morphism, nút, input, animation CSS cơ bản |

### Nhóm `(app)/` — Trang có sidebar (yêu cầu đăng nhập)

| File / Route | Chức năng |
|--------------|-----------|
| `(app)/layout.tsx` | Bọc `ShellGate` — kiểm tra auth, redirect intro |
| `(app)/page.tsx` → `/` | Trang Chat AI gợi ý sách |
| `(app)/share/page.tsx` → `/share` | Bảng tin chia sẻ cộng đồng |
| `(app)/reading/page.tsx` → `/reading` | Đồng hồ đọc sách + thành tựu |
| `(app)/intro/page.tsx` → `/intro` | Trang giới thiệu lần đầu (thay popup onboarding) |
| `(app)/karuta/page.tsx` → `/karuta` | Lobby Karuta: tìm trận, tạo/vào phòng |
| `(app)/karuta/matchmaking/page.tsx` | Hàng đợi ghép ngẫu nhiên |
| `(app)/karuta/room/[code]/page.tsx` | Phòng chơi (chờ / đang chơi) |
| `(app)/karuta/leaderboard/page.tsx` | Bảng xếp hạng Karuta |
| `(app)/karuta/contribute/page.tsx` | Gửi câu hỏi Karuta chờ duyệt |

### Trang Admin (không dùng AppShell)

| File | Chức năng |
|------|-----------|
| `admin/page.tsx` → `/admin` | Đăng nhập admin + panel quản trị |

### API Routes (`src/app/api/`)

| File | Method | Chức năng |
|------|--------|-----------|
| `api/books/chat/route.ts` | POST | Gửi tin nhắn/ảnh tới Gemini, trả gợi ý sách |
| `api/admin/login/route.ts` | POST | Đăng nhập admin (username/password) |
| `api/admin/logout/route.ts` | POST | Xóa session admin |
| `api/admin/session/route.ts` | GET | Kiểm tra session admin hiện tại |
| `api/admin/questions/route.ts` | GET | Lấy danh sách câu hỏi Karuta |
| `api/admin/questions/[id]/route.ts` | PATCH | Duyệt / từ chối câu hỏi |
| `api/admin/shares/reports/route.ts` | GET | Lấy bài đăng bị báo cáo (nhóm theo post) |
| `api/admin/shares/[postId]/route.ts` | DELETE | Xóa bài chia sẻ + likes + comments + reports |

---

## `src/components/` — UI Components

### `shell/` — Khung ứng dụng

| File | Chức năng |
|------|-----------|
| `AppShell.tsx` | Sidebar + bottom nav, theme toggle, thông tin user |
| `ShellGate.tsx` | Cổng auth: loading → login → intro → AppShell |
| `LoginScreen.tsx` | Màn hình đăng nhập Google / dùng thử khách |

### `providers/` — React Context

| File | Chức năng |
|------|-----------|
| `AuthProvider.tsx` | Quản lý Google Auth, guest session, `playerId` |
| `ThemeProvider.tsx` | Dark/light mode (`class` trên `<html>`) |
| `GsapProvider.tsx` | Đăng ký GSAP plugin toàn app |

### `chat/`

| File | Chức năng |
|------|-----------|
| `ChatView.tsx` | Giao diện chat AI: nhập text, gửi ảnh bìa, hiển thị markdown |

### `share/`

| File | Chức năng |
|------|-----------|
| `ShareFeed.tsx` | Bảng tin: danh sách bài, like, comment, báo cáo |
| `ShareWriteModal.tsx` | Popup viết bài chia sẻ (GSAP modal) |
| `ReportPostModal.tsx` | Popup báo cáo bài đăng vi phạm |

### `reading/`

| File | Chức năng |
|------|-----------|
| `ReadingTimer.tsx` | Bộ đếm thời gian đọc, khóa màn hình |
| `ReadingLockScreen.tsx` | Overlay khóa khi đang đọc |
| `AchievementsPanel.tsx` | Hiển thị thành tựu đọc sách đã mở khóa |

### `karuta/`

| File | Chức năng |
|------|-----------|
| `KarutaShell.tsx` | Wrapper căn giữa trang Karuta (`default` / `lobby` / `wide`) |

### Karuta — game components (root `components/`)

| File | Chức năng |
|------|-----------|
| `GameBoard.tsx` | Bàn chơi: câu hỏi, lưới thẻ, điểm, kết quả vòng/trận |
| `KarutaCard.tsx` | Thẻ đáp án, animation GSAP (vào / đúng / sai / xóa) |
| `ScoreBoard.tsx` | Tỷ số 2 người chơi, animation khi ghi điểm |
| `WaitingRoom.tsx` | Phòng chờ: cài đặt, sẵn sàng, bắt đầu game |

### `admin/`

| File | Chức năng |
|------|-----------|
| `AdminLoginForm.tsx` | Form đăng nhập admin |
| `AdminPanel.tsx` | Duyệt câu hỏi Karuta + xử lý báo cáo bài chia sẻ |

### `ui/` — Components dùng chung

| File | Chức năng |
|------|-----------|
| `BookLoading.tsx` | Spinner loading kiểu sách (GSAP) |
| `MatchmakingPulse.tsx` | Animation radar khi tìm trận |

---

## `src/lib/` — Logic nghiệp vụ

| File | Chức năng |
|------|-----------|
| `firebase.ts` | Khởi tạo Firebase client (Auth + Realtime DB) |
| `firebase-admin.ts` | Firebase Admin SDK (server-side, API admin) |
| `auth.ts` | Google sign-in / sign-out / subscribe auth state |
| `guest.ts` | Phiên khách 1 giờ (localStorage) |
| `admin-auth.ts` | Session cookie admin (HMAC), verify credentials |
| `onboarding.ts` | Lưu trạng thái đã xem intro (`localStorage`) |
| `cn.ts` | Utility gộp class Tailwind (`clsx` + `tailwind-merge`) |
| `animations.ts` | Preset GSAP: fade, modal, stagger, card flip/remove… |

### Karuta & game

| File | Chức năng |
|------|-----------|
| `game.ts` | Phòng, vòng chơi, thẻ, điểm, `retiredCardIds`, seed câu hỏi mặc định |
| `matchmaking.ts` | Hàng đợi ghép ngẫu nhiên (transaction, onDisconnect) |
| `leaderboard.ts` | Ghi/đọc kết quả trận, bảng xếp hạng |

### Chia sẻ & đọc sách

| File | Chức năng |
|------|-----------|
| `shares.ts` | CRUD bài viết, like, comment, báo cáo |
| `reading.ts` | Timer đọc, achievements, chia sẻ thành tựu |

### AI Chat

| File | Chức năng |
|------|-----------|
| `books/gemini.ts` | Gọi Google Gemini API, build prompt gợi ý sách |
| `books/chat-history.ts` | Định dạng lịch sử chat cho Gemini |

---

## `src/hooks/`

| File | Chức năng |
|------|-----------|
| `useGsapReveal.ts` | Hook reveal/stagger khi mount component |
| `useGsapModal.ts` | Hook mở/đóng modal với animation GSAP + ESC |

---

## `src/types/`

| File | Chức năng |
|------|-----------|
| `game.ts` | `Room`, `Card`, `Question`, `LeaderboardEntry`, `MatchmakingEntry`… |
| `share.ts` | `SharePost`, `ShareComment`, `ShareReport` |
| `reading.ts` | `ReadingSession`, `Achievement` |

---

## `docs/`

| File | Chức năng |
|------|-----------|
| `FIREBASE_SETUP.md` | Hướng dẫn tạo project Firebase, rules RTDB, env, matchmaking |

---

## `patches/`

| Thư mục | Chức năng |
|---------|-----------|
| `patches/dom-exception/` | Patch thay `node-domexception` (override trong `package.json`) |

---

## File cấu hình gốc

| File | Chức năng |
|------|-----------|
| `package.json` | Dependencies, scripts `dev` / `build` / `start` / `lint` |
| `next.config.ts` | Redirect URL cũ (`/room/:code` → `/karuta/room/:code`, …) |
| `tailwind.config.ts` | Palette warm/cold, glass shadow, background mesh |
| `postcss.config.mjs` | PostCSS + Autoprefixer |
| `tsconfig.json` | TypeScript strict, alias `@/*` → `src/*` |
| `.env.example` | Mẫu biến: Firebase, Gemini, Admin |

---

## Luồng dữ liệu Firebase (Realtime Database)

| Node | Mô tả |
|------|--------|
| `rooms/{code}` | Trạng thái phòng Karuta |
| `matchmaking/{playerId}` | Hàng đợi tìm trận |
| `questions/{id}` | Ngân hàng câu hỏi Karuta |
| `leaderboard/{userId}` | Thống kê thắng/thua |
| `shares/{id}` | Bài chia sẻ |
| `shareLikes/{postId}/{userId}` | Tim bài |
| `shareComments/{postId}/{id}` | Bình luận |
| `shareReports/{postId}/{userId}` | Báo cáo bài đăng |

---

## Routes tóm tắt

| URL | Mô tả |
|-----|--------|
| `/` | Chat AI gợi ý sách |
| `/share` | Bảng tin cộng đồng |
| `/reading` | Đồng hồ đọc sách |
| `/intro` | Giới thiệu lần đầu |
| `/karuta` | Lobby game |
| `/karuta/matchmaking` | Tìm trận ngẫu nhiên |
| `/karuta/room/{code}` | Phòng chơi |
| `/karuta/leaderboard` | Xếp hạng |
| `/karuta/contribute` | Đóng góp câu hỏi |
| `/admin` | Quản trị (câu hỏi + báo cáo) |
