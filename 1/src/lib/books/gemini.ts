import { GoogleGenerativeAI } from "@google/generative-ai";

export const DEFAULT_GREETING =
  "Xin chào! Tôi là trợ lý gợi ý sách AI. Bạn muốn tìm sách theo sở thích gì hôm nay, hay muốn tôi phân tích bìa sách nào không?";

const SYSTEM_INSTRUCTION = `Bạn là một chatbot chuyên gia gợi ý sách nhiệt tình và am hiểu. Mục tiêu của bạn là giúp người dùng tìm được những cuốn sách hay dựa trên sở thích, hoặc qua hình ảnh bìa sách họ tải lên.

ĐẶC BIỆT QUAN TRỌNG:
1. TÌM BẰNG TÊN TIẾNG VIỆT: BẮT BUỘC tìm sách/truyện bằng TÊN TIẾNG VIỆT cho mọi đầu sách.
2. CUNG CẤP LINK ĐỌC VÀ LINK MUA:
   - Link Đọc: Luôn sinh link search bar trên dtv-ebook.com.vn. Cú pháp: https://dtv-ebook.com.vn/#gsc.tab=0&gsc.q=TÊN_SÁCH_TIẾNG_VIỆT_KHÔNG_DẤU. Định dạng markdown: '[Đọc ngay](URL_DTV)'.
   - Link Mua: Luôn sinh link tìm kiếm trên Shopee. Cú pháp: https://shopee.vn/search?keyword=sách+TÊN_SÁCH_TIẾNG_VIỆT. Định dạng markdown: '[Tham khảo mua](URL_SHOPEE)'.
3. CẤU TRÚC PHẢN HỒI: Ở cuối mỗi phần giới thiệu sách, hãy đặt cả hai link này cạnh nhau.

Luôn lịch sự, giải thích lý do gợi ý và trả lời hoàn toàn bằng tiếng Việt.`;

const SEED_HISTORY = [
  { role: "user" as const, parts: [{ text: "Hello" }] },
  { role: "model" as const, parts: [{ text: DEFAULT_GREETING }] },
];

export function getBookModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong .env");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });
}

export interface ChatHistoryItem {
  role: "user" | "model";
  content: string;
}

export function buildGeminiHistory(history: ChatHistoryItem[]) {
  const past = history.slice(0, -1);

  if (past.length <= 1) {
    return SEED_HISTORY;
  }

  const trimmed =
    past[0]?.role === "model" ? past.slice(1) : past;

  if (trimmed.length === 0 || trimmed.length === 1) {
    return SEED_HISTORY;
  }

  return trimmed.map((m) => ({
    role: m.role,
    parts: [{ text: m.content || "Ảnh đính kèm" }],
  }));
}
