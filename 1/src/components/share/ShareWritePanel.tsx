"use client";

import { useState } from "react";
import { ImagePlus, PenLine } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createSharePost } from "@/lib/shares";

interface ShareWritePanelProps {
  onPosted?: () => void;
}

export default function ShareWritePanel({ onPosted }: ShareWritePanelProps) {
  const { playerId, displayName, photoURL } = useAuth();
  const [bookTitle, setBookTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !playerId) return;
    setSubmitting(true);
    setSuccess(false);
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
      setContent("");
      setBookTitle("");
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setSuccess(true);
      onPosted?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass-panel animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        <PenLine className="h-5 w-5 text-violet-500" />
        <h2 className="text-lg font-bold text-stone-900 dark:text-white">
          Viết bài
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          placeholder="Tên sách (tuỳ chọn)"
          className="input-field"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết cảm nghĩ, review, trích dẫn hay về cuốn sách..."
          rows={5}
          className="input-field resize-none"
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="btn-secondary flex cursor-pointer items-center gap-2 !py-2 text-sm">
            <ImagePlus className="h-4 w-4" />
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
            Thêm ảnh bìa
          </label>
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="" className="h-20 rounded-lg" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  if (imagePreview) URL.revokeObjectURL(imagePreview);
                  setImagePreview(null);
                }}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-xs text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        {success && (
          <p className="text-sm text-emerald-600 dark:text-emerald-300">
            Đã đăng bài thành công!
          </p>
        )}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Đang đăng..." : "Đăng bài"}
        </button>
      </form>
    </section>
  );
}
