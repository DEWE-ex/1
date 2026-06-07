# Karuta Online — 1 vs 1

Game Karuta 1 đấu 1 online, đồng bộ realtime qua **Firebase Realtime Database**, deploy trên **Vercel**.

## Tính năng

- Tạo / tham gia phòng bằng mã 6 ký tự
- Đấu 1 vs 1 realtime — ai chạm thẻ đúng trước được điểm
- Đóng góp câu hỏi (cặp gợi ý + đáp án)
- Thắng khi đạt 5 điểm

## Cài đặt

### 1. Firebase

1. Tạo project tại [Firebase Console](https://console.firebase.google.com)
2. Bật **Realtime Database** (chế độ test hoặc deploy rules từ `database.rules.json`)
3. Tạo Web App, copy config vào file `.env`

### 2. Biến môi trường

File `.env` đã có sẵn — điền thông tin Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000

### 4. Deploy Vercel

1. Push code lên GitHub
2. Import project trên [Vercel](https://vercel.com)
3. Thêm các biến `NEXT_PUBLIC_FIREBASE_*` trong **Settings → Environment Variables**
4. Deploy

## Cấu trúc Firebase

```
rooms/{roomCode}     — trạng thái phòng, điểm số, vòng chơi
questions/{id}       — câu hỏi đóng góp (chỉ thêm mới, không sửa/xóa)
```

## Luật chơi

1. Chủ phòng tạo phòng → chia sẻ mã
2. Khách tham gia → cả hai bấm **Sẵn sàng**
3. Chủ phòng bấm **Bắt đầu**
4. Hiện câu gợi ý + 6 thẻ — chạm thẻ đúng nhanh nhất
5. Ai đạt 5 điểm trước thắng
