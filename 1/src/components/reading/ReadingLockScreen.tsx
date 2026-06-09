"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen } from "lucide-react";

interface ReadingLockScreenProps {
  bookTitle: string;
  totalSeconds: number;
  onComplete: (elapsedSeconds: number) => void;
  onEmergencyExit: (elapsedSeconds: number) => void;
}

export default function ReadingLockScreen({
  bookTitle,
  totalSeconds,
  onComplete,
  onEmergencyExit,
}: ReadingLockScreenProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const elapsedRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const blockKeys = (e: KeyboardEvent) => {
      if (e.key !== "Tab") e.preventDefault();
    };
    window.addEventListener("keydown", blockKeys, true);

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* unsupported */
      }
    };
    requestWakeLock();

    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", blockKeys, true);
      wakeLockRef.current?.release().catch(() => {});
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          if (!finishedRef.current) {
            finishedRef.current = true;
            onComplete(totalSeconds);
          }
          return 0;
        }
        elapsedRef.current = totalSeconds - r + 1;
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [totalSeconds, onComplete]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const startHold = () => {
    if (holdTimerRef.current) return;
    holdTimerRef.current = setInterval(() => {
      setHoldProgress((p) => {
        if (p >= 100) {
          if (holdTimerRef.current) clearInterval(holdTimerRef.current);
          holdTimerRef.current = null;
          if (!finishedRef.current) {
            finishedRef.current = true;
            onEmergencyExit(elapsedRef.current || totalSeconds - remaining);
          }
          return 100;
        }
        return p + 4;
      });
    }, 100);
  };

  const stopHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;

  return (
    <div className="reading-lock fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 via-violet-950 to-stone-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <BookOpen className="mb-6 h-16 w-16 animate-pulse text-violet-300" />
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">
          Đang đọc
        </p>
        <h1 className="mt-2 max-w-md text-2xl font-bold leading-snug md:text-3xl">
          {bookTitle || "Cuốn sách của bạn"}
        </h1>

        <div className="mt-10 font-mono text-7xl font-bold tabular-nums tracking-tight md:text-8xl">
          {formatTime(remaining)}
        </div>

        <div className="mt-8 h-2 w-64 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-rose-400 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-8 max-w-sm text-sm text-white/50">
          Màn hình đang khóa. Hãy tập trung đọc sách.
        </p>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center px-6">
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={startHold}
          onTouchEnd={stopHold}
          className="relative flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm font-semibold text-red-300 transition active:bg-red-500/20"
        >
          <AlertTriangle className="h-5 w-5" />
          Giữ 3 giây để thoát khẩn cấp
        </button>
        <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-red-400 transition-all"
            style={{ width: `${holdProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
