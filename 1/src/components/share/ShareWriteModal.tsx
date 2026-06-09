"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, PenLine, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createSharePost } from "@/lib/shares";
import { useGsapModal } from "@/hooks/useGsapModal";

interface ShareWriteModalProps {
  open: boolean;
  onClose: () => void;
  onPosted?: () => void;
}

export default function ShareWriteModal({
  open,
  onClose,
  onPosted,
}: ShareWriteModalProps) {
  const { playerId, displayName, photoURL } = useAuth();
  const { backdropRef, panelRef, handleClose } = useGsapModal(open, onClose);

  const [bookTitle, setBookTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setBookTitle("");
    setContent("");
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !playerId) return;
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result as string);
          r.readAsDataURL(imageFile);
        });
      }
      await createSharePost(
        playerId,
        displayName,
        photoURL ?? undefined,
        content,
        imageUrl,
        bookTitle || undefined,
        "book"
      );
      resetForm();
      onPosted?.();
      handleClose();
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
        aria-labelledby="write-post-title"
        className="glass-strong relative z-10 w-full max-w-md rounded-2xl p-4 shadow-glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-violet-500" />
            <h2
              id="write-post-title"
              className="text-base font-bold text-stone-900 dark:text-white"
            >
              Viết bài
            </h2>
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

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="Tên sách (tuỳ chọn)"
            className="input-field !py-2 text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cảm nghĩ, review, trích dẫn..."
            rows={4}
            className="input-field resize-none text-sm"
            required
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="btn-secondary flex cursor-pointer items-center gap-1.5 !py-1.5 text-xs">
              <ImagePlus className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setImageFile(f);
                    setImagePreview(URL.createObjectURL(f));
                  }
                }}
              />
              Thêm ảnh
            </label>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="" className="h-14 rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    if (imagePreview) URL.revokeObjectURL(imagePreview);
                    setImagePreview(null);
                  }}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-1 text-white"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-sm"
          >
            {submitting ? "Đang đăng..." : "Đăng bài"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
