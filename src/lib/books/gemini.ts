import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
] as const;

function isRetryableGeminiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("404") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("not found")
  );
}

const SYSTEM_INSTRUCTION = `Bạn là một chatbot chuyên gia gợi ý sách nhiệt tình và am hiểu. Mục tiêu của bạn là giúp người dùng tìm được những cuốn sách hay dựa trên sở thích, hoặc qua hình ảnh bìa sách họ tải lên.

ĐẶC BIỆT QUAN TRỌNG:
1. TÌM BẰNG TÊN TIẾNG VIỆT: BẮT BUỘC tìm sách/truyện bằng TÊN TIẾNG VIỆT cho mọi đầu sách.
2. CUNG CẤP LINK MUA: Luôn sinh link tìm kiếm trên Shopee. Cú pháp: https://shopee.vn/search?keyword=sách+TÊN_SÁCH_TIẾNG_VIỆT. Định dạng markdown: '[Tham khảo mua](URL_SHOPEE)'.
3. CẤU TRÚC PHẢN HỒI: Ở cuối mỗi phần giới thiệu sách, hãy đặt link mua.

Luôn lịch sự, giải thích lý do gợi ý và trả lời hoàn toàn bằng tiếng Việt.`;

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong .env");
  }
  return apiKey;
}

export function getPrimaryGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export function getBookModel(modelName = getPrimaryGeminiModel()): GenerativeModel {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION,
  });
}

export function getGeminiModelChain(): string[] {
  const primary = getPrimaryGeminiModel();
  const chain = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  return [...new Set(chain)];
}

export async function sendBookChatMessage(
  history: ReturnType<typeof buildGeminiHistory>,
  parts: string | Array<string | { inlineData: { data: string; mimeType: string } }>
): Promise<string> {
  const models = getGeminiModelChain();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const chat = getBookModel(modelName).startChat({ history });
      const result = await chat.sendMessage(parts);
      return result.response.text();
    } catch (err) {
      lastError = err;
      if (!isRetryableGeminiError(err)) throw err;
      console.warn(`[Gemini] ${modelName} failed, trying fallback...`, err);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Tất cả model Gemini đều không khả dụng");
}

export interface ChatHistoryItem {
  role: "user" | "model";
  content: string;
}

export function buildGeminiHistory(history: ChatHistoryItem[]) {
  const past = history.slice(0, -1);

  if (past.length === 0) {
    return [];
  }

  return past.map((m) => ({
    role: m.role,
    parts: [{ text: m.content || "Ảnh đính kèm" }],
  }));
}

export function isBuyLink(href?: string, text?: string): boolean {
  if (!href) return false;
  const t = (text || "").toLowerCase();
  return (
    t.includes("tham khảo mua") ||
    t.includes("mua") ||
    href.includes("shopee")
  );
}
