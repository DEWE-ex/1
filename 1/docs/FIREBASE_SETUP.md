# Hướng dẫn setup Firebase cho BookFinder / Karuta

## 1. Tạo project Firebase

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. **Add project** → đặt tên (ví dụ: `bookfinder-karuta`)
3. Tắt Google Analytics nếu không cần
4. Chọn region gần VN: **asia-southeast1** (Singapore)

## 2. Bật Realtime Database

Karuta và matchmaking dùng **Realtime Database** (không phải Firestore).

1. **Build → Realtime Database → Create Database**
2. Chọn **asia-southeast1**
3. Chế độ ban đầu: **locked mode** (sẽ sửa rules bên dưới)

### Database Rules (khuyến nghị cho dev)

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    },
    "matchmaking": {
      "$playerId": {
        ".read": true,
        ".write": true
      }
    },
    "questions": {
      ".read": true,
      "$questionId": {
        ".write": "newData.child('status').val() === 'pending'"
      }
    },
    "leaderboard": {
      ".read": true,
      "$userId": {
        ".write": true
      }
    },
    "shares": {
      ".read": true,
      "$postId": {
        ".write": true
      }
    },
    "shareLikes": {
      ".read": true,
      "$postId": {
        ".write": true
      }
    },
    "shareComments": {
      ".read": true,
      "$postId": {
        ".write": true
      }
    },
    "shareReports": {
      ".read": false,
      "$postId": {
        "$reporterId": {
          ".write": true,
          ".read": true
        }
      }
    }
  }
}
```

> **Production:** thêm xác thực `auth != null` và validate dữ liệu. Hiện tại app dùng guest ID + Google Auth.

### Cấu trúc dữ liệu

| Path | Mô tả |
|------|--------|
| `rooms/{code}` | Phòng Karuta (host, guest, điểm, vòng chơi) |
| `matchmaking/{playerId}` | Hàng đợi ghép ngẫu nhiên |
| `questions/{id}` | Ngân hàng câu hỏi Karuta |
| `leaderboard/{userId}` | Bảng xếp hạng |

## 3. Bật Authentication (Google)

1. **Build → Authentication → Get started**
2. **Sign-in method → Google → Enable**
3. Thêm domain authorized: `localhost` (dev) và domain deploy

## 4. Lấy config Web App

1. **Project settings** (bánh răng) → **Your apps → Web** (`</>`)
2. Đăng ký app → copy các giá trị vào `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

3. Copy file mẫu:

```bash
cp .env.example .env.local
```

## 5. Service Account (Admin API)

Dùng cho route `/api/admin/*` duyệt câu hỏi.

1. **Project settings → Service accounts**
2. **Generate new private key** → tải file JSON
3. Thêm vào `.env.local`:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

> Giữ nguyên JSON trên **một dòng**. Không commit file này.

## 6. Chạy app

```bash
npm install
npm run dev
```

Mở `http://localhost:3000/karuta` → thử **Tìm trận ngay** hoặc **Tạo phòng**.

## 7. Cơ chế Matchmaking

```
Player A vào queue → ghi matchmaking/{playerId}
Player B vào queue → đọc queue, tìm đối thủ cũ nhất

Bước ghép (atomic):
  1. A chạy transaction lock B: matchedBy = A
  2. A tạo phòng (B là host), A join làm guest
  3. Ghi roomCode cho cả A và B
  4. Cả hai subscribe → redirect vào /karuta/room/{code}

An toàn:
  - runTransaction tránh 2 người cùng ghép 1 đối thủ
  - onDisconnect tự xóa entry khi đóng tab
  - Mutex in-flight tránh gọi joinMatchmaking trùng lặp
  - Cleanup entry > 5 phút không có phòng
```

### Debug matchmaking

1. Firebase Console → Realtime Database → xem node `matchmaking`
2. Mỗi player chỉ có 1 entry; `roomCode` xuất hiện khi ghép thành công
3. Nếu kẹt: xóa node `matchmaking` thủ công và thử lại

## 8. Checklist lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| "Không thể tham gia hàng đợi" | Thiếu `NEXT_PUBLIC_FIREBASE_*` | Kiểm tra `.env.local`, restart `npm run dev` |
| Phòng không sync | Sai `DATABASE_URL` | URL phải khớp region RTDB |
| Google login lỗi | Chưa bật Auth / sai domain | Thêm `localhost` vào Authorized domains |
| Admin API 500 | Thiếu `FIREBASE_SERVICE_ACCOUNT_JSON` | Tạo service account key |
| Permission denied | Rules quá chặt | Dùng rules mẫu ở mục 2 |
