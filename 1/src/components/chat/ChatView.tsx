"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  BookOpen,
  Send,
  Bot,
  User,
  Mic,
  X,
  ShoppingBag,
  Plus,
  Trash2,
  Share2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { isBuyLink } from "@/lib/books/gemini";
import {
  loadChatHistory,
  saveChatHistory,
  type ChatMessage,
} from "@/lib/books/chat-history";
import { useAuth } from "@/components/providers/AuthProvider";
import BookLoading from "@/components/ui/BookLoading";
import { createSharePost } from "@/lib/shares";
import { useRouter } from "next/navigation";

export default function ChatView() {
  const router = useRouter();
  const { user, displayName, playerId, photoURL, isGuest } = useAuth();
  const uid = user?.uid ?? playerId!;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [sharingIdx, setSharingIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (isGuest) {
      startNewChat();
      return;
    }
    setHistoryLoaded(false);
    loadChatHistory(uid)
      .then((history) => {
        if (history && history.length > 0) setMessages(history);
        else startNewChat();
      })
      .catch(() => startNewChat())
      .finally(() => setHistoryLoaded(true));
  }, [uid, startNewChat, isGuest]);

  useEffect(() => {
    if (!historyLoaded || isGuest) return;
    if (messages.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveChatHistory(uid, messages).catch(console.error);
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, uid, historyLoaded, isGuest]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const win = window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR() as {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    recognition.lang = "vi-VN";
    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInput((p) => (p ? `${p} ${t}` : t));
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.includes("image")) {
          const f = items[i].getAsFile();
          if (f) {
            setSelectedImage(f);
            setSelectedImageUrl(URL.createObjectURL(f));
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const handleClearChat = async () => {
    setMessages([]);
    if (!isGuest) await saveChatHistory(uid, []);
  };

  const handleShareMessage = async (idx: number) => {
    const msg = messages[idx];
    if (!msg || !playerId) return;
    setSharingIdx(idx);
    try {
      await createSharePost(
        playerId,
        displayName,
        photoURL ?? undefined,
        msg.content,
        msg.imageUrl,
      );
      router.push("/share");
    } catch (err) {
      console.error(err);
    } finally {
      setSharingIdx(null);
    }
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve((r.result as string).split(",")[1]);
      r.readAsDataURL(file);
    });

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage = input.trim();
    const imgFile = selectedImage;
    let previewUrl = "";
    if (imgFile) {
      previewUrl = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result as string);
        r.readAsDataURL(imgFile);
      });
    }

    setInput("");
    setSelectedImage(null);
    setSelectedImageUrl(null);

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage, imageUrl: previewUrl || undefined },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      if (imgFile) {
        imageBase64 = await fileToBase64(imgFile);
        imageMimeType = imgFile.type;
      }

      const res = await fetch("/api/books/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: newMessages,
          message: userMessage,
          imageBase64,
          imageMimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi API");
      setMessages((p) => [...p, { role: "model", content: data.text }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi";
      setMessages((p) => [...p, { role: "model", content: `Lỗi: ${msg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!historyLoaded) {
    return (
      <div className="glass flex h-[calc(100vh-1rem)] items-center justify-center">
        <BookLoading label="Đang tải lịch sử chat..." />
      </div>
    );
  }

  return (
    <div className="glass animate-fade-in flex h-[calc(100vh-1rem)] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/20 px-3 py-2 dark:border-cold-border">
        <div>
          <h2 className="text-sm font-bold text-stone-900 dark:text-white">
            Trợ lý gợi ý sách
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Xin chào, {displayName}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearChat}
          className="rounded-xl p-2 text-stone-400 transition hover:bg-white/50 hover:text-stone-700 dark:hover:bg-cold-800/50 dark:hover:text-slate-200"
          title="Xóa lịch sử"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {messages.length === 0 && (
          <div className="animate-slide-up mb-6 flex flex-col items-center justify-center py-8 text-center">
            <h3 className="text-xl font-medium text-stone-700 dark:text-slate-200 sm:text-2xl">
            Xin chào, hôm nay {" "}
              <span className="bg-gradient-to-r from-violet-500 via-warm-500 to-rose-500 bg-clip-text text-transparent">
                {displayName || "bạn"}
              </span>
              {" "}muốn đọc sách nào?
            </h3>
            <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
              Gửi ảnh bìa sách hoặc mô tả sở thích
            </p>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`animate-message-in flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
            >
              <div
                className={`flex max-w-[90%] gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-violet-500 to-rose-500 text-white"
                      : "glass text-warm-600 dark:text-cold-300"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className={msg.role === "user" ? "text-right" : ""}>
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt=""
                      className="mb-2 max-h-56 rounded-lg shadow-lg"
                    />
                  )}
                  {msg.content && msg.content !== "Tìm cuốn sách này" && (
                    <div
                      className={`inline-block rounded-2xl px-3 py-2.5 text-left text-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-violet-500/90 to-rose-500/90 text-white"
                          : "glass"
                      }`}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => {
                              const text = String(children);
                              if (isBuyLink(href, text)) {
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-link-buy"
                                  >
                                    <ShoppingBag className="h-3 w-3" />
                                    Tham khảo mua
                                  </a>
                                );
                              }
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.role === "model" && (
                        <button
                          type="button"
                          onClick={() => handleShareMessage(i)}
                          disabled={sharingIdx === i}
                          className="mt-1.5 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-stone-500 transition hover:bg-white/40 hover:text-warm-600 dark:hover:text-cold-300"
                        >
                          <Share2 className="h-3 w-3" />
                          {sharingIdx === i ? "Đang chia sẻ..." : "Chia sẻ"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="animate-message-in flex gap-2">
              <div className="glass flex h-8 w-8 items-center justify-center rounded-lg">
                <Bot className="h-4 w-4" />
              </div>
              <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2.5">
                <BookOpen className="h-5 w-5 book-flip-icon text-warm-500 dark:text-cold-400" />
                <span className="text-xs text-stone-500">Đang suy nghĩ...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/20 p-2.5 dark:border-cold-border sm:p-3">
        {selectedImageUrl && (
          <div className="relative mb-2 inline-block">
            <img src={selectedImageUrl} alt="" className="h-14 rounded-lg" />
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
                setSelectedImageUrl(null);
              }}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="glass flex items-end gap-1.5 rounded-2xl p-1.5"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setSelectedImage(f);
                setSelectedImageUrl(URL.createObjectURL(f));
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-2 text-stone-500 hover:bg-white/50 dark:hover:bg-cold-800/50"
          >
            <Plus className="h-4 w-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Hỏi về sách..."
            rows={1}
            className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => {
              if (!recognitionRef.current) return;
              if (isListening) recognitionRef.current.stop();
              else {
                recognitionRef.current.start();
                setIsListening(true);
              }
            }}
            className={`rounded-xl p-2 ${isListening ? "text-red-500" : "text-stone-500"}`}
          >
            <Mic className="h-4 w-4" />
          </button>
          {(input.trim() || selectedImage) && (
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary !rounded-xl !px-2.5 !py-2"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
