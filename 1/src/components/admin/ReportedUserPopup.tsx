"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Ban,
  ShieldOff,
  Trash2,
  X,
} from "lucide-react";
import { useGsapModal } from "@/hooks/useGsapModal";
import type { ReportedAuthor } from "@/types/admin";

interface ReportedUserPopupProps {
  open: boolean;
  user: ReportedAuthor | null;
  onClose: () => void;
  onAction: (
    action: "delete" | "ban" | "unban",
    user: ReportedAuthor
  ) => Promise<void>;
}

export default function ReportedUserPopup({
  open,
  user,
  onClose,
  onAction,
}: ReportedUserPopupProps) {
  const { backdropRef, panelRef, handleClose } = useGsapModal(open, onClose);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setActionId(null);
  }, [open]);

  if (!open || typeof document === "undefined" || !user) return null;

  const handleAction = async (action: "delete" | "ban" | "unban") => {
    setActionId(action);
    try {
      await onAction(action, user);
    } finally {
      setActionId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-labelledby="reported-user-title"
        className="glass-strong relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/20 p-4 dark:border-cold-border">
          <div className="flex items-start gap-3">
            {user.authorPhoto ? (
              <img
                src={user.authorPhoto}
                alt=""
                className="h-10 w-10 rounded-full ring-2 ring-white/50"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-amber-400 text-sm font-bold text-white">
                {(user.authorName || user.authorId).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3
                id="reported-user-title"
                className="flex items-center gap-1.5 text-base font-bold"
              >
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                {user.authorName || "(Ẩn danh)"}
              </h3>
              <p className="break-all font-mono text-[10px] text-stone-400">
                {user.authorId}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-700 dark:text-rose-300">
                  {user.totalReports} báo cáo
                </span>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
                  {user.reportedPosts} bài vi phạm
                </span>
                {user.banned && (
                  <span className="rounded-full bg-stone-700 px-2 py-0.5 font-semibold text-white">
                    Đã bị ban
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-white/50 dark:hover:bg-cold-800/50"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Bài viết bị báo cáo
          </p>
          {user.posts.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">
              Không còn bài viết nào trên hệ thống.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {user.posts.map((p) => (
                <li
                  key={p.postId}
                  className="rounded-xl border border-white/30 bg-white/40 p-2.5 text-xs dark:border-cold-border dark:bg-cold-800/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-stone-400">
                      #{p.postId.slice(0, 8)}
                    </span>
                    <span className="font-semibold text-rose-500">
                      {p.reportCount} báo cáo
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-stone-700 dark:text-slate-200">
                    {p.preview || "(không có nội dung)"}
                  </p>
                  <p className="mt-1 text-[10px] text-stone-400">
                    Mới nhất: {new Date(p.latestAt).toLocaleString("vi-VN")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/20 p-3 dark:border-cold-border sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => handleAction("delete")}
            disabled={actionId !== null || user.posts.length === 0}
            className="btn-secondary flex items-center justify-center gap-1.5 !px-3 !py-2 text-xs disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {actionId === "delete" ? "Đang xoá..." : "Xoá khỏi danh sách"}
          </button>
          {user.banned ? (
            <button
              type="button"
              onClick={() => handleAction("unban")}
              disabled={actionId !== null}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              <ShieldOff className="h-3.5 w-3.5" />
              {actionId === "unban" ? "Đang bỏ ban..." : "Bỏ ban"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAction("ban")}
              disabled={actionId !== null}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              <Ban className="h-3.5 w-3.5" />
              {actionId === "ban" ? "Đang ban..." : "Ban tài khoản"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}