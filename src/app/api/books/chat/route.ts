import { NextResponse } from "next/server";
import {
  buildGeminiHistory,
  sendBookChatMessage,
  type ChatHistoryItem,
} from "@/lib/books/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      history,
      message,
      imageBase64,
      imageMimeType,
    }: {
      history: ChatHistoryItem[];
      message: string;
      imageBase64?: string;
      imageMimeType?: string;
    } = body;

    if (!message?.trim() && !imageBase64) {
      return NextResponse.json(
        { error: "Tin nhắn trống" },
        { status: 400 }
      );
    }

    const geminiHistory = buildGeminiHistory(history || []);
    const userText = message?.trim() || "Tìm cuốn sách này";

    const text = await sendBookChatMessage(
      geminiHistory,
      imageBase64 && imageMimeType
        ? [
            { inlineData: { data: imageBase64, mimeType: imageMimeType } },
            userText,
          ]
        : userText
    );

    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi Gemini API";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
