"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Question } from "@/types/game";

export default function AdminPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    if (!res.ok) {
      router.replace("/admin/login");
      return false;
    }
    const data = await res.json();
    setUsername(data.username);
    return true;
  }, [router]);

  const loadQuestions = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/questions");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể tải câu hỏi");
      }
      const data = await res.json();
      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    }
  }, []);

  useEffect(() => {
    loadSession().then((ok) => {
      if (ok) loadQuestions().finally(() => setLoading(false));
    });
  }, [loadSession, loadQuestions]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Thao tác thất bại");
      }
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setActionId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const pending = questions.filter((q) => q.status === "pending");
  const approved = questions.filter((q) => q.status === "approved");
  const rejected = questions.filter((q) => q.status === "rejected");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="app-bg" />
        <div className="glass-panel relative z-10 text-center">
          <p className="animate-pulse text-stone-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4">
      <div className="app-bg" />
      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm text-stone-500 hover:underline">
          ← Về BookFinder
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Quản trị câu hỏi</h2>
            <p className="text-sm text-stone-500">Xin chào, {username}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-stone-500 underline-offset-2 hover:underline"
          >
            Đăng xuất
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 text-center">
          <StatBox label="Chờ duyệt" value={pending.length} color="amber" />
          <StatBox label="Đã duyệt" value={approved.length} color="green" />
          <StatBox label="Từ chối" value={rejected.length} color="red" />
        </div>

        <QuestionSection
          title={`Chờ duyệt (${pending.length})`}
          questions={pending}
          actionId={actionId}
          onAction={handleAction}
          showActions
          emptyText="Không có câu hỏi chờ duyệt"
        />

        <QuestionSection
          title={`Đã duyệt (${approved.length})`}
          questions={approved.slice(0, 10)}
          actionId={actionId}
          onAction={handleAction}
          showActions={false}
          emptyText="Chưa có câu hỏi nào"
        />
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "amber" | "green" | "red";
}) {
  const colors = {
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    green: "border-green-300 bg-green-50 text-green-800",
    red: "border-red-300 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function QuestionSection({
  title,
  questions,
  actionId,
  onAction,
  showActions,
  emptyText,
}: {
  title: string;
  questions: Question[];
  actionId: string | null;
  onAction: (id: string, action: "approve" | "reject") => void;
  showActions: boolean;
  emptyText: string;
}) {
  return (
    <div className="glass-panel">
      <h3 className="text-lg font-bold">{title}</h3>
      {questions.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {questions.map((q) => (
            <li
              key={q.id}
              className="glass rounded-xl p-4"
            >
              <p className="font-medium text-warm-600 dark:text-cold-300">「{q.clue}」</p>
              <p className="mt-1 text-sm">→ {q.answer}</p>
              <p className="mt-1 text-xs text-stone-400">
                bởi {q.contributedBy} ·{" "}
                {new Date(q.createdAt).toLocaleString("vi-VN")}
              </p>
              {showActions && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onAction(q.id, "approve")}
                    disabled={actionId === q.id}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionId === q.id ? "..." : "Duyệt"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction(q.id, "reject")}
                    disabled={actionId === q.id}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
