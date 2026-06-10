"use client";

import { useState } from "react";
import { BookOpen, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginScreen() {
  const { signIn, signInAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    signInAsGuest();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="app-bg" />
      <div className="glass-strong animate-fade-in relative z-10 w-full max-w-sm rounded-2xl p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-warm-400 to-rose-500 shadow-glow">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
          BookFinder
        </h1>
        <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-400">
          Gợi ý sách AI · Karuta · Chia sẻ cộng đồng
        </p>

        {error && (
          <div className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="btn-secondary mt-5 flex w-full items-center justify-center gap-2.5"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt=""
            className="h-4 w-4"
          />
          {loading ? "Đang đăng nhập..." : "Đăng nhập bằng Google"}
        </button>

        <div className="my-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-stone-200 dark:bg-slate-700" />
          <span className="text-xs text-stone-400">hoặc</span>
          <div className="h-px flex-1 bg-stone-200 dark:bg-slate-700" />
        </div>

        <button
          type="button"
          onClick={handleGuest}
          className="btn-primary flex w-full items-center justify-center gap-1.5"
        >
          <Clock className="h-3.5 w-3.5" />
          Dùng thử 1 giờ (khách)
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 dark:text-slate-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Lịch sử chat đồng bộ khi đăng nhập Google</span>
        </div>
      </div>
    </div>
  );
}
