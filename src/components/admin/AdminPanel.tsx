"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Flag, LogOut, Shield, Trash2 } from "lucide-react";
import type { Question } from "@/types/game";
import type { ReportedAuthor, ReportedUsersResponse } from "@/types/admin";
import ReportedUserPopup from "./ReportedUserPopup";

interface ReportedPost {
  postId: string;
  postAuthorName?: string;
  postPreview?: string;
  reportCount: number;
  latestAt: number;
  reasons: string[];
}

type AdminTab = "questions" | "reports" | "users";

export default function AdminPanel() {
  const [username, setUsername] = useState("");
  const [tab, setTab] = useState<AdminTab>("questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [reportedUsers, setReportedUsers] = useState<ReportedAuthor[]>([]);
  const [reportThreshold, setReportThreshold] = useState(3);
  const [totalBanned, setTotalBanned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [openUser, setOpenUser] = useState<ReportedAuthor | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/admin/session");
    if (!res.ok) return false;
    const data = await res.json();
    setUsername(data.username);
    return true;
  }, []);

  const loadQuestions = useCallback(async () => {
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

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/shares/reports");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể tải báo cáo");
      }
      const data = await res.json();
      setReportedPosts(data.grouped ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải báo cáo");
    }
  }, []);

  const loadReportedUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users/reported");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể tải danh sách vi phạm");
      }
      const data = (await res.json()) as ReportedUsersResponse;
      setReportedUsers(data.reported ?? []);
      if (typeof data.threshold === "number") {
        setReportThreshold(data.threshold);
      }
      if (typeof data.totalBanned === "number") {
        setTotalBanned(data.totalBanned);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải danh sách vi phạm");
    }
  }, []);

  useEffect(() => {
    loadSession().then((ok) => {
      if (ok) {
        Promise.all([
          loadQuestions(),
          loadReports(),
          loadReportedUsers(),
        ]).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [loadSession, loadQuestions, loadReports, loadReportedUsers]);

  const handleQuestionAction = async (
    id: string,
    action: "approve" | "reject"
  ) => {
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Xóa bài đăng này? Hành động không thể hoàn tác.")) return;
    setActionId(postId);
    try {
      const res = await fetch(`/api/admin/shares/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa bài");
      }
      await loadReports();
      await loadReportedUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi xóa bài");
    } finally {
      setActionId(null);
    }
  };

  const handleUserAction = async (
    action: "delete" | "ban" | "unban",
    target: ReportedAuthor
  ) => {
    try {
      if (action === "delete") {
        if (
          !confirm(
            `Xoá toàn bộ bài viết của ${target.authorName || target.authorId}? Hành động không thể hoàn tác.`
          )
        )
          return;
        const res = await fetch(
          `/api/admin/users/${encodeURIComponent(target.authorId)}/posts`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Không thể xoá bài viết");
        }
      } else if (action === "ban") {
        if (
          !confirm(
            `Ban tài khoản ${target.authorName || target.authorId}? Người này sẽ không thể đăng bài mới.`
          )
        )
          return;
        const res = await fetch(
          `/api/admin/users/${encodeURIComponent(target.authorId)}/ban`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: target.authorName,
              reason: `Bị report ${target.totalReports} lần`,
            }),
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Không thể ban tài khoản");
        }
      } else if (action === "unban") {
        const res = await fetch(
          `/api/admin/users/${encodeURIComponent(target.authorId)}/ban`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Không thể bỏ ban");
        }
      }
      await Promise.all([loadReports(), loadReportedUsers()]);
      setPopupOpen(false);
      setOpenUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi xử lý tài khoản");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  };

  const pending = questions.filter((q) => q.status === "pending");
  const approved = questions.filter((q) => q.status === "approved");

  if (loading) {
    return (
      <div className="glass-panel text-center">
        <p className="animate-pulse text-stone-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-1">
      <div className="glass-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-violet-500" />
            <div>
              <h2 className="text-xl font-bold">Quản trị</h2>
              <p className="text-sm text-stone-500">Xin chào, {username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary flex items-center gap-2 !px-4 !py-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("questions")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === "questions"
                ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                : "text-stone-500 hover:bg-white/50"
            }`}
          >
            Câu hỏi ({pending.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("reports")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === "reports"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "text-stone-500 hover:bg-white/50"
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            Báo cáo ({reportedPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === "users"
                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                : "text-stone-500 hover:bg-white/50"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Tài khoản vi phạm ({reportedUsers.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-2 text-xs font-semibold underline"
          >
            Đóng
          </button>
        </div>
      )}

      {tab === "questions" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatBox label="Chờ duyệt" value={pending.length} variant="amber" />
            <StatBox label="Đã duyệt" value={approved.length} variant="green" />
            <StatBox
              label="Từ chối"
              value={questions.filter((q) => q.status === "rejected").length}
              variant="red"
            />
          </div>

          <QuestionSection
            title={`Chờ duyệt (${pending.length})`}
            questions={pending}
            actionId={actionId}
            onAction={handleQuestionAction}
            showActions
            emptyText="Không có câu hỏi chờ duyệt"
          />

          <QuestionSection
            title={`Đã duyệt gần đây (${Math.min(approved.length, 10)})`}
            questions={approved.slice(0, 10)}
            actionId={actionId}
            onAction={handleQuestionAction}
            showActions={false}
            emptyText="Chưa có câu hỏi nào"
          />
        </>
      )}

      {tab === "reports" && (
        <div className="glass-panel">
          <h3 className="text-lg font-bold">
            Bài đăng bị báo cáo ({reportedPosts.length})
          </h3>
          {reportedPosts.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              Chưa có báo cáo nào.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reportedPosts.map((item) => (
                <li key={item.postId} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {item.reportCount} báo cáo ·{" "}
                        {new Date(item.latestAt).toLocaleString("vi-VN")}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {item.postAuthorName || "Ẩn danh"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-slate-300">
                        {item.postPreview || "(Không có nội dung)"}
                      </p>
                      <ul className="mt-2 space-y-0.5 text-xs text-stone-500">
                        {item.reasons.slice(0, 3).map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(item.postId)}
                      disabled={actionId === item.postId}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="glass-panel">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">
              Tài khoản bị report &gt; {reportThreshold} lần
            </h3>
            <p className="text-xs text-stone-500">
              Tổng bị ban: {totalBanned} · Hiện đang hiển thị:{" "}
              {reportedUsers.length}
            </p>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Bấm vào tài khoản để mở popup xem chi tiết &amp; xử lý.
          </p>

          {reportedUsers.length === 0 ? (
            <p className="mt-6 text-center text-sm text-stone-500">
              Chưa có tài khoản nào bị report vượt ngưỡng.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {reportedUsers.map((u) => (
                <li key={u.authorId}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenUser(u);
                      setPopupOpen(true);
                    }}
                    className="glass flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/70 dark:hover:bg-cold-800/60"
                  >
                    {u.authorPhoto ? (
                      <img
                        src={u.authorPhoto}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white/50"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-amber-400 text-sm font-bold text-white">
                        {(u.authorName || u.authorId).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {u.authorName || "(Ẩn danh)"}
                      </p>
                      <p className="truncate font-mono text-[10px] text-stone-400">
                        {u.authorId}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 font-semibold text-rose-700 dark:text-rose-300">
                          {u.totalReports} báo cáo
                        </span>
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
                          {u.reportedPosts} bài
                        </span>
                        {u.banned && (
                          <span className="rounded-full bg-stone-700 px-1.5 py-0.5 font-semibold text-white">
                            Đã ban
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-violet-600 dark:text-violet-300">
                      Xem →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ReportedUserPopup
        open={popupOpen}
        user={openUser}
        onClose={() => {
          setPopupOpen(false);
        }}
        onAction={handleUserAction}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "amber" | "green" | "red";
}) {
  const styles = {
    amber:
      "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    green:
      "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    red: "border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-300",
  };
  return (
    <div className={`glass rounded-xl border p-4 text-center ${styles[variant]}`}>
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
            <li key={q.id} className="glass rounded-xl p-4">
              <p className="font-medium text-warm-600 dark:text-cold-300">
                {q.clue}
              </p>
              <p className="mt-1 text-sm text-stone-700 dark:text-slate-300">
                → {q.answer}
              </p>
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
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction(q.id, "reject")}
                    disabled={actionId === q.id}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
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