"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Calendar, Clock, Hash, X } from "lucide-react";
import { useGsapModal } from "@/hooks/useGsapModal";
import type { ReadingSession } from "@/types/reading";
import { formatReadingTime } from "@/lib/reading";

interface ReadingSessionModalProps {
  open: boolean;
  session: ReadingSession | null;
  isNewSession: boolean;
  onClose: () => void;
  onSave: (pageNumber: number | null) => Promise<void>;
}

export default function ReadingSessionModal({
  open,
  session,
  isNewSession,
  onClose,
  onSave,
}: ReadingSessionModalProps) {
  const { backdropRef, panelRef, handleClose } = useGsapModal(open, onClose);
  const [pageNumberStr, setPageNumberStr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && session) {
      setPageNumberStr(session.pageNumber !== undefined ? String(session.pageNumber) : "");
    } else {
      setPageNumberStr("");
    }
  }, [open, session]);

  if (!open || !session || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const val = pageNumberStr.trim();
      const num = val === "" ? null : Math.max(1, parseInt(val, 10));
      await onSave(num);
      handleClose();
    } catch (err) {
      console.error("Lỗi khi lưu số trang:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDate = new Date(session.completedAt).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        className="glass-strong relative z-10 w-full max-w-sm rounded-2xl p-5 text-stone-850 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <BookOpen className="h-4 w-4" />
            <h2 className="text-sm font-bold">
              {isNewSession ? "Hoàn thành phiên đọc!" : "Chi tiết phiên đọc"}
            </h2>
          </div>
          <button type="button" onClick={handleClose} className="p-1 hover:opacity-75 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {isNewSession && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-center bg-emerald-500/10 py-1.5 px-3 rounded-lg">
              🎉 Tuyệt vời! Bạn đã hoàn thành thời gian tập trung đọc sách.
            </p>
          )}

          <div className="space-y-2 rounded-xl bg-white/20 dark:bg-cold-800/20 p-3 text-xs leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-stone-500 dark:text-slate-400 min-w-[80px] shrink-0">Sách:</span>
              <span className="font-bold text-stone-850 dark:text-slate-200 break-words">{session.bookTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-stone-400" />
              <span className="font-semibold text-stone-500 dark:text-slate-400 min-w-[80px]">Thời gian:</span>
              <span className="font-medium text-stone-800 dark:text-slate-200">{formatReadingTime(session.durationMinutes)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <span className="font-semibold text-stone-500 dark:text-slate-400 min-w-[80px]">Thời điểm:</span>
              <span className="font-medium text-stone-800 dark:text-slate-200">{formattedDate}</span>
            </div>
            {session.pageNumber !== undefined && (
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-stone-400" />
                <span className="font-semibold text-stone-500 dark:text-slate-400 min-w-[80px]">Trang hiện tại:</span>
                <span className="font-bold text-violet-650 dark:text-violet-400">Trang {session.pageNumber}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="pageNumberInput" className="text-xs font-semibold text-stone-600 dark:text-slate-350">
                {session.pageNumber !== undefined ? "Cập nhật trang đang đọc:" : "Trang đang đọc (tùy chọn):"}
              </label>
              <input
                id="pageNumberInput"
                type="number"
                min={1}
                value={pageNumberStr}
                onChange={(e) => setPageNumberStr(e.target.value)}
                placeholder="Ví dụ: 42..."
                className="input-field text-xs !py-2"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary flex-1 text-xs py-2"
              >
                {isNewSession ? "Bỏ qua" : "Hủy"}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1 text-xs py-2"
              >
                {submitting ? "Đang lưu..." : "Lưu số trang"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
