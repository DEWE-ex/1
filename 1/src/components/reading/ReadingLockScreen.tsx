"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Youtube } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { playReadingClockDone } from "@/lib/sounds";

interface ReadingLockScreenProps {
  bookTitle: string;
  totalSeconds: number;
  youtubeVideoId?: string;
  onComplete: (elapsedSeconds: number) => void;
  onEmergencyExit: (elapsedSeconds: number) => void;
}

function formatTime(secs: number) {
  const safe = Math.max(0, secs);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export default function ReadingLockScreen({
  bookTitle,
  totalSeconds,
  youtubeVideoId,
  onComplete,
  onEmergencyExit,
}: ReadingLockScreenProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showVideo, setShowVideo] = useState(!!youtubeVideoId);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const finishedRef = useRef(false);
  const endTimeRef = useRef(Date.now() + totalSeconds * 1000);
  const onCompleteRef = useRef(onComplete);
  const onEmergencyExitRef = useRef(onEmergencyExit);

  onCompleteRef.current = onComplete;
  onEmergencyExitRef.current = onEmergencyExit;

  const getRemaining = () =>
    Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));

  const getElapsed = () => Math.min(totalSeconds, totalSeconds - getRemaining());

  const finish = (elapsedSeconds: number, playSound: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (playSound) playReadingClockDone();
    onCompleteRef.current(elapsedSeconds);
  };

  useEffect(() => {
    finishedRef.current = false;
    endTimeRef.current = Date.now() + totalSeconds * 1000;
    setRemaining(totalSeconds);

    const tick = () => {
      const left = getRemaining();
      setRemaining(left);

      if (left <= 0) {
        finish(totalSeconds, true);
      }
    };

    tick();
    const interval = setInterval(tick, 250);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [totalSeconds]);

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

  const startHold = () => {
    if (holdTimerRef.current) return;
    holdTimerRef.current = setInterval(() => {
      setHoldProgress((p) => {
        if (p >= 100) {
          if (holdTimerRef.current) clearInterval(holdTimerRef.current);
          holdTimerRef.current = null;
          if (!finishedRef.current) {
            finishedRef.current = true;
            onEmergencyExitRef.current(getElapsed());
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

  const progress =
    totalSeconds > 0
      ? ((totalSeconds - remaining) / totalSeconds) * 100
      : 0;

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
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-rose-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-8 max-w-sm text-sm text-white/50">
          Màn hình đang khóa. Hãy tập trung đọc sách.
        </p>
      </div>

      {youtubeVideoId && (
        <div className="absolute right-4 top-4 z-20 w-72 max-w-[calc(100vw-2rem)]">
          <div className="overflow-hidden rounded-xl border border-white/20 bg-black/40 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                <Youtube className="h-3.5 w-3.5 text-red-400" />
                Nhạc nền
              </span>
              <button
                type="button"
                onClick={() => setShowVideo((v) => !v)}
                className="text-[10px] text-white/60 hover:text-white"
              >
                {showVideo ? "Ẩn" : "Hiện"}
              </button>
            </div>
            {showVideo && (
              <div className="relative aspect-video w-full">
                <iframe
                  title="YouTube nhạc nền"
                  src={youtubeEmbedUrl(youtubeVideoId, true)}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      )}

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
