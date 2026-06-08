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
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { DEFAULT_GREETING } from "@/lib/books/gemini";
import {
  loadChatHistory,
  saveChatHistory,
  type ChatMessage,
} from "@/lib/books/chat-history";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ChatView() {
  const { user, displayName } = useAuth();
  const uid = user!.uid;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startNewChat = useCallback(() => {
    setMessages([{ role: "model", content: DEFAULT_GREETING }]);
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    setHistoryLoaded(false);
    loadChatHistory(uid)
      .then((history) => {
        if (history && history.length > 0) setMessages(history);
        else startNewChat();
      })
      .catch(() => startNewChat())
      .finally(() => setHistoryLoaded(true));
  }, [uid, startNewChat]);

  useEffect(() => {
    if (!historyLoaded || messages.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveChatHistory(uid, messages).catch(console.error);
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, uid, historyLoaded]);

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
    const fresh = [{ role: "model" as const, content: DEFAULT_GREETING }];
    setMessages(fresh);
    await saveChatHistory(uid, fresh);
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

  return (
    <div className="glass flex h-[calc(100vh-2rem)] flex-col overflow-hidden md:h-[calc(100vh-1.5rem)]">
      <div className="flex items-center justify-between border-b border-white/20 px-4 py-3 dark:border-cold-border">
        <div>
          <h2 className="font-bold text-stone-900 dark:text-white">
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {messages.length <= 1 && (
          <div className="mb-8 flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-2xl font-medium text-stone-700 dark:text-slate-200 sm:text-3xl">
              Hỏi về sách,{" "}
              <span className="bg-gradient-to-r from-warm-500 to-amber-400 bg-clip-text text-transparent dark:from-cold-400 dark:to-cyan-300">
                {displayName}
              </span>
            </h3>
            <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
              Gửi ảnh bìa sách hoặc mô tả sở thích
            </p>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-8">
          {messages.map((msg, i) =>
            (i === 0 && messages.length > 1) || i > 0 ? (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[90%] gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-warm-400 to-warm-500 text-white dark:from-cold-500 dark:to-cold-600"
                        : "glass text-warm-600 dark:text-cold-300"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div className={msg.role === "user" ? "text-right" : ""}>
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt=""
                        className="mb-2 max-h-64 rounded-xl shadow-lg"
                      />
                    )}
                    {msg.content && msg.content !== "Tìm cuốn sách này" && (
                      <div
                        className={`inline-block rounded-2xl px-4 py-3 text-left ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-warm-400/90 to-warm-500/90 text-white dark:from-cold-600/90 dark:to-cold-700/90"
                            : "glass"
                        }`}
                      >
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown
                            components={{
                              a: ({ href, children }) => {
                                const t = String(children).toLowerCase();
                                if (
                                  (t.includes("đọc ngay") ||
                                    t.includes("tham khảo mua")) &&
                                  href
                                ) {
                                  return (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mr-2 mt-2 inline-flex items-center rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold no-underline"
                                    >
                                      {t.includes("đọc ngay") ? (
                                        <BookOpen className="mr-1 h-3 w-3" />
                                      ) : (
                                        <ShoppingBag className="mr-1 h-3 w-3" />
                                      )}
                                      {children}
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="glass flex h-10 w-10 items-center justify-center rounded-xl">
                <Bot className="h-5 w-5" />
              </div>
              <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
                <Sparkles className="h-4 w-4 animate-pulse text-warm-500 dark:text-cold-400" />
                <span className="text-sm text-stone-500">Đang suy nghĩ...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/20 p-3 dark:border-cold-border sm:p-4">
        {selectedImageUrl && (
          <div className="relative mb-2 inline-block">
            <img src={selectedImageUrl} alt="" className="h-16 rounded-lg" />
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
          className="glass flex items-end gap-2 rounded-2xl p-2"
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
            className="rounded-xl p-2.5 text-stone-500 hover:bg-white/50 dark:hover:bg-cold-800/50"
          >
            <Plus className="h-5 w-5" />
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
            className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-stone-800 outline-none placeholder:text-stone-400 dark:text-slate-100 dark:placeholder:text-slate-500"
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
            className={`rounded-xl p-2.5 ${isListening ? "text-red-500" : "text-stone-500"}`}
          >
            <Mic className="h-5 w-5" />
          </button>
          {(input.trim() || selectedImage) && (
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary !rounded-xl !px-3 !py-2.5"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
