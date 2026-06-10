"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, X } from "lucide-react";
import { useGsapModal } from "@/hooks/useGsapModal";

const REASONS = [
  "Spam / quảng cáo",
  "Nội dung thô tục",
  "Thông tin sai lệch",
  "Vi phạm bản quyền",
  "Khác",
];

interface ReportPostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export default function ReportPostModal({
  open,
  onClose,
  onSubmit,
}: ReportPostModalProps) {
  const { backdropRef, panelRef, handleClose } = useGsapModal(open, onClose);
  const [reason, setReason] = useState(REASONS[0]);
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setDone(false);
      setReason(REASONS[0]);
      setCustom("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const finalReason =
        reason === "Khác" ? custom.trim() || "Khác" : reason;
      await onSubmit(finalReason);
      setDone(true);
      setTimeout(handleClose, 1200);
    } catch (err) {
      console.error("Report submission failed:", err);
      setError("Gửi báo cáo thất bại. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || typeof document === "undefined") return null;

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
        className="glass-strong relative z-10 w-full max-w-sm rounded-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Flag className="h-4 w-4" />
            <h2 className="text-sm font-bold">Báo cáo bài đăng</h2>
          </div>
          <button type="button" onClick={handleClose} className="p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <p className="py-4 text-center text-sm text-emerald-600 dark:text-emerald-400">
            Đã gửi báo cáo. Admin sẽ xem xét.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              {REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition ${
                    reason === r
                      ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
                      : "hover:bg-white/40 dark:hover:bg-cold-800/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-violet-500"
                  />
                  {r}
                </label>
              ))}
            </div>
            {reason === "Khác" && (
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Mô tả lý do..."
                className="input-field text-sm"
              />
            )}
            {error && (
              <p className="text-center text-xs font-semibold text-rose-500">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-sm"
            >
              {submitting ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
