import { NextResponse } from "next/server";
import {
  buildGeminiHistory,
  getBookModel,
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

    const model = getBookModel();
    const geminiHistory = buildGeminiHistory(history || []);
    const chat = model.startChat({ history: geminiHistory });

    let result;
    const userText = message?.trim() || "Tìm cuốn sách này";

    if (imageBase64 && imageMimeType) {
      result = await chat.sendMessage([
        { inlineData: { data: imageBase64, mimeType: imageMimeType } },
        userText,
      ]);
    } else {
      result = await chat.sendMessage(userText);
    }

    const response = await result.response;
    return NextResponse.json({ text: response.text() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi Gemini API";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
