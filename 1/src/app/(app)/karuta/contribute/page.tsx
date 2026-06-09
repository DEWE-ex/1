"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { contributeQuestion } from "@/lib/game";
import type { QuestionCategory } from "@/types/game";

export default function ContributePage() {
  const { displayName, user } = useAuth();
  const defaultAuthor = user?.displayName || displayName;

  const [clue, setClue] = useState("");
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
        category
      );
      setClue("");
      setAnswer("");
      setSuccess(true);
    } catch {
      setError("Không thể gửi câu hỏi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-1">
      <div className="glass-panel">
        <h2 className="text-xl font-bold">Đóng góp câu hỏi Karuta</h2>
        <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
          Câu hỏi sẽ được admin duyệt trước khi dùng trong game.
        </p>
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
                { value: "books", label: "📚 Sách" },
                { value: "poetry", label: "🎋 Văn thơ" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${
                  category === opt.value
                    ? "bg-gradient-to-r from-violet-500 to-rose-500 text-white"
                    : "glass"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            className="input-field"
            placeholder="Câu đọc / Gợi ý"
            maxLength={200}
            required
          />
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
      </div>
    </div>
  );
}
