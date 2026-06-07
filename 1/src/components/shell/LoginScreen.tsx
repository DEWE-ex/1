"use client";

import { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginScreen() {
  const { signIn } = useAuth();
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

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="app-bg" />
      <div className="glass-panel relative z-10 w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warm-400 to-warm-500 shadow-glow dark:from-cold-500 dark:to-cold-600 dark:shadow-glow-cold">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
          BookFinder
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
          Gợi ý sách AI · Karuta 1 vs 1
        </p>
        <p className="mt-1 text-xs text-stone-400 dark:text-slate-500">
          Một tài khoản Google cho chat &amp; game
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="btn-secondary mt-8 flex w-full items-center justify-center gap-3"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt=""
            className="h-5 w-5"
          />
          {loading ? "Đang đăng nhập..." : "Đăng nhập bằng Google"}
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-stone-400 dark:text-slate-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Lịch sử chat đồng bộ cloud</span>
        </div>
      </div>
    </div>
  );
}
