"use client";

import { useEffect, useState } from "react";
import { Book, ScrollText } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { contributeQuestion } from "@/lib/game";
import type { QuestionCategory } from "@/types/game";
import KarutaShell from "@/components/karuta/KarutaShell";
import GuestRestrictedHint from "@/components/ui/GuestRestrictedHint";

export default function ContributePage() {
  const { displayName, user, isGuest } = useAuth();
  const defaultAuthor = user?.displayName || displayName;

  const [clue, setClue] = useState("");
  const [extraClue1, setExtraClue1] = useState("");
  const [extraClue2, setExtraClue2] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState<QuestionCategory>("books");
  const [author, setAuthor] = useState(defaultAuthor);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAuthor(defaultAuthor);
  }, [defaultAuthor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;
    if (!clue.trim() || !answer.trim()) {
      setError("Vui lòng điền đầy đủ câu đọc và đáp án");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      await contributeQuestion(
        clue,
        answer,
        author.trim() || displayName,
        category,
        category === "books" ? [extraClue1, extraClue2] : []
      );
      setClue("");
      setExtraClue1("");
      setExtraClue2("");
      setAnswer("");
      setSuccess(true);
    } catch {
      setError("Không thể gửi câu hỏi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KarutaShell size="wide">
      <div className="glass-panel">
        <h2 className="text-xl font-bold">Đóng góp câu hỏi Karuta</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
          Câu hỏi sẽ được admin duyệt trước khi dùng trong game.
        </p>

        {isGuest ? (
          <div className="mt-6 rounded-xl bg-amber-500/10 p-4">
            <GuestRestrictedHint action="đóng góp câu hỏi" />
            <p className="mt-2 text-sm text-stone-600 dark:text-slate-300">
              Tài khoản khách chỉ có thể chơi Karuta và xem nội dung.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="input-field"
              placeholder="Tên hiển thị"
              maxLength={20}
            />
            <div className="flex gap-2">
              {(
                [
                  { value: "books", label: "Sách", icon: Book },
                  { value: "poetry", label: "Văn thơ", icon: ScrollText },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setCategory(opt.value);
                    if (opt.value === "poetry") {
                      setExtraClue1("");
                      setExtraClue2("");
                    }
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                    category === opt.value
                      ? "bg-amber-500 text-white dark:bg-cyan-500"
                      : "glass"
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={clue}
              onChange={(e) => setClue(e.target.value)}
              className="input-field"
              placeholder={
                category === "books"
                  ? "Gợi ý 1 (xuất hiện ngay)"
                  : "Câu đọc / Gợi ý"
              }
              maxLength={200}
              required
            />
            {category === "books" && (
              <>
                <input
                  type="text"
                  value={extraClue1}
                  onChange={(e) => setExtraClue1(e.target.value)}
                  className="input-field"
                  placeholder="Gợi ý 2 (sau 5 giây, tùy chọn)"
                  maxLength={200}
                />
                <input
                  type="text"
                  value={extraClue2}
                  onChange={(e) => setExtraClue2(e.target.value)}
                  className="input-field"
                  placeholder="Gợi ý 3 (sau 10 giây, tùy chọn)"
                  maxLength={200}
                />
              </>
            )}
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Đáp án (nội dung thẻ)"
              maxLength={300}
              required
            />
            {error && (
              <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                Đã gửi! Đang chờ admin duyệt.
              </div>
            )}
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Đang gửi..." : "Gửi câu hỏi"}
            </button>
          </form>
        )}
      </div>
    </KarutaShell>
  );
}
