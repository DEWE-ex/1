import { ref, get, set } from "firebase/database";
import { getDb } from "@/lib/firebase";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  imageUrl?: string;
}

export async function loadChatHistory(
  userId: string
): Promise<ChatMessage[] | null> {
  const snap = await get(ref(getDb(), `chatHistory/${userId}`));
  if (!snap.exists()) return null;
  const data = snap.val() as { messages: ChatMessage[] };
  return data.messages ?? null;
}

export async function saveChatHistory(
  userId: string,
  messages: ChatMessage[]
): Promise<void> {
  await set(ref(getDb(), `chatHistory/${userId}`), {
    messages,
    updatedAt: Date.now(),
  });
}
