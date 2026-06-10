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

const RING_SIZE = 280;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
      if (left <= 0) finish(totalSeconds, true);
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
    totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="reading-lock fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#0c0a14] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(139,92,246,0.22),transparent)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_at_center_bottom,rgba(244,63,94,0.08),transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="mb-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-violet-200/90">
          <BookOpen className="h-3.5 w-3.5" />
          Đang đọc
        </div>

        <h1 className="max-w-lg text-xl font-bold leading-snug text-white/95 md:text-2xl">
          {bookTitle || "Cuốn sách của bạn"}
        </h1>

        <div className="relative mt-10" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg
            className="-rotate-90"
            width={RING_SIZE}
            height={RING_SIZE}
            aria-hidden
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="url(#readingRingGrad)"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              className="transition-[stroke-dashoffset] duration-300 ease-linear"
            />
            <defs>
              <linearGradient id="readingRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-5xl font-bold tabular-nums tracking-tight md:text-6xl">
              {formatTime(remaining)}
            </span>
            <span className="mt-1 text-[11px] text-white/40">
              {Math.round(progress * 100)}% hoàn thành
            </span>
          </div>
        </div>

        <p className="mt-8 max-w-xs text-sm leading-relaxed text-white/45">
          Hãy để điện thoại, mở sách và đọc thôi.
        </p>
      </div>

      {youtubeVideoId && (
        <div className="absolute right-4 top-4 z-20 w-64 max-w-[calc(100vw-2rem)] sm:w-72">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
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

      <div className="absolute bottom-8 left-0 right-0 z-10 flex flex-col items-center px-6">
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={startHold}
          onTouchEnd={stopHold}
          className="relative flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-3.5 text-sm font-semibold text-red-200 transition active:bg-red-500/20"
        >
          <AlertTriangle className="h-4 w-4" />
          Giữ 3 giây để thoát
        </button>
        <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-red-400/90 transition-all"
            style={{ width: `${holdProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
