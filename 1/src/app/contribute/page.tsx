"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { contributeQuestion, getAllQuestions } from "@/lib/game";
import { getStoredPlayerName, setStoredPlayerName } from "@/lib/storage";
import type { Question } from "@/types/game";

export default function ContributePage() {
  const [clue, setClue] = useState("");
  const [answer, setAnswer] = useState("");
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    setAuthor(getStoredPlayerName());
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoadingList(true);
    try {
      const qs = await getAllQuestions();
      setQuestions(qs.sort((a, b) => b.createdAt - a.createdAt));
    } catch {
      setError("Không thể tải danh sách câu hỏi");
    } finally {
      setLoadingList(false);
    }
  };

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
      setStoredPlayerName(author.trim());
      await contributeQuestion(clue, answer, author);
      setClue("");
      setAnswer("");
      setSuccess(true);
      await loadQuestions();
    } catch {
      setError("Không thể gửi câu hỏi. Kiểm tra kết nối Firebase.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <div className="mx-auto max-w-2xl space-y-8">
        <div className="card-panel">
          <h2 className="text-xl font-bold">Đóng góp câu hỏi</h2>
          <p className="mt-2 text-sm text-karuta-wood/70">
            Thêm cặp câu đọc (gợi ý) và đáp án (thẻ Karuta). Câu hỏi sẽ được
            dùng trong các trận đấu 1 vs 1.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="author" className="block text-sm font-medium">
                Tên của bạn
              </label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="input-field mt-1"
                placeholder="Tên hiển thị"
                maxLength={20}
              />
            </div>

            <div>
              <label htmlFor="clue" className="block text-sm font-medium">
                Câu đọc / Gợi ý
              </label>
              <input
                id="clue"
                type="text"
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                className="input-field mt-1"
                placeholder="VD: Chim én về báo xuân đến"
                maxLength={200}
                required
              />
            </div>

            <div>
              <label htmlFor="answer" className="block text-sm font-medium">
                Đáp án (nội dung thẻ)
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="input-field mt-1 min-h-[80px] resize-y"
                placeholder="VD: Xuân về chim én tìm về tổ"
                maxLength={300}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
                Cảm ơn! Câu hỏi đã được thêm thành công.
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Đang gửi..." : "Gửi câu hỏi"}
              </button>
              <a href="/" className="btn-secondary">
                Về trang chủ
              </a>
            </div>
          </form>
        </div>

        <div className="card-panel">
          <h3 className="text-lg font-bold">
            Câu hỏi trong hệ thống ({questions.length})
          </h3>

          {loadingList ? (
            <p className="mt-4 animate-pulse text-sm text-karuta-wood">
              Đang tải...
            </p>
          ) : questions.length === 0 ? (
            <p className="mt-4 text-sm text-karuta-wood">
              Chưa có câu hỏi nào.
            </p>
          ) : (
            <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">
              {questions.map((q) => (
                <li
                  key={q.id}
                  className="rounded-lg border border-karuta-gold/20 bg-karuta-cream/50 p-3"
                >
                  <p className="text-sm font-medium text-karuta-red">
                    「{q.clue}」
                  </p>
                  <p className="mt-1 text-sm text-karuta-ink">→ {q.answer}</p>
                  <p className="mt-1 text-xs text-karuta-wood/50">
                    bởi {q.contributedBy}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
