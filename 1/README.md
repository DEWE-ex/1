# BookFinder

Ứng dụng thống nhất: **Chatbot gợi ý sách AI** (chính) + **Karuta 1 vs 1** (tính năng phụ).

- **Một tài khoản Google** cho chat & game Karuta
- **Next.js 16** · Firebase Auth + Realtime Database · Gemini AI
- **UI glass morphism** — tông ấm (light) / tông lạnh (dark)

## Cấu trúc

| Route | Mô tả |
|-------|-------|
| `/` | Chatbot gợi ý sách (mặc định) |
| `/karuta` | Lobby game Karuta |
| `/karuta/matchmaking` | Ghép ngẫu nhiên |
| `/karuta/room/[code]` | Phòng chơi |
| `/karuta/contribute` | Đóng góp câu hỏi |
| `/admin` | Duyệt câu hỏi (tài khoản riêng) |

## Cài đặt

```bash
npm install
npm run dev
```

### Firebase Console

1. **Authentication** → bật **Google**
2. **Realtime Database** → deploy `database.rules.json`
3. Thêm domain authorized (localhost + Vercel)

### `.env`

```env
NEXT_PUBLIC_FIREBASE_*=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
FIREBASE_SERVICE_ACCOUNT_JSON=...
```

## Deploy Vercel

Thêm tất cả biến môi trường, deploy như Next.js app thông thường.
