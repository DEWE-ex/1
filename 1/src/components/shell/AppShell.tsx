"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { themeIconSpin } from "@/lib/animations";
import {
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gamepad2,
  Heart,
  Timer,
  LogOut,
  MessageSquare,
  Moon,
  PlusCircle,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { isSoundEnabled, setSoundEnabled, primeAudio } from "@/lib/sounds";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/cn";

const SIDEBAR_COLLAPSED_KEY = "bookfinder_sidebar_collapsed";

const nav = [
  { href: "/", label: "Chat", icon: MessageSquare },
  { href: "/share", label: "Chia sẻ", icon: Heart },
  { href: "/share/saved", label: "Đã lưu", icon: Bookmark },
  { href: "/reading", label: "Đọc sách", icon: Timer },
  { href: "/karuta", label: "Karuta", icon: Gamepad2 },
  { href: "/karuta/leaderboard", label: "Xếp hạng", icon: Trophy },
  { href: "/karuta/contribute", label: "Đóng góp", icon: PlusCircle },
];

function formatTimeLeft(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut, displayName, photoURL, isGuest, guestTimeLeft } =
    useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const themeIconRef = useRef<HTMLSpanElement>(null);
  const themeMounted = useRef(false);
  const [soundOn, setSoundOn] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const visibleNav = isGuest
    ? nav.filter((item) => item.href !== "/karuta/contribute")
    : nav;

  useEffect(() => {
    if (!themeMounted.current) {
      themeMounted.current = true;
      return;
    }
    if (themeIconRef.current) {
      themeIconSpin(themeIconRef.current);
    }
  }, [isDarkMode]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/karuta")
      return (
        pathname === "/karuta" ||
        pathname.startsWith("/karuta/room") ||
        pathname.startsWith("/karuta/matchmaking")
      );
    if (href === "/karuta/leaderboard")
      return pathname === "/karuta/leaderboard";
    if (href === "/share/saved") return pathname === "/share/saved";
    if (href === "/share") return pathname === "/share";
    return pathname.startsWith(href);
  };

  return (
    <div className="relative flex min-h-screen">
      <div className="app-bg" />

      <aside
        className={cn(
          "glass-sidebar fixed left-2 top-2 z-40 hidden h-[calc(100vh-1rem)] transition-[width] duration-300 ease-out md:flex",
          collapsed ? "w-[4.5rem]" : "w-52",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-white/20 pb-3 pt-1 dark:border-cold-border",
            collapsed ? "justify-center px-1" : "gap-2 px-2",
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-warm-400 to-rose-500">
            <BookOpen className="h-3.5 w-3.5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-stone-900 dark:text-white">
                BookFinder
              </p>
              <p className="text-[9px] text-stone-500 dark:text-slate-400">
                Made by ThiemTruong with ❤️
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="rounded-lg p-1 text-stone-400 transition hover:bg-white/40 hover:text-stone-700 dark:hover:bg-cold-800/50 dark:hover:text-slate-200"
              aria-label="Thu gọn menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mx-auto mt-2 rounded-lg p-1.5 text-stone-400 transition hover:bg-white/40 hover:text-stone-700 dark:hover:bg-cold-800/50 dark:hover:text-slate-200"
            aria-label="Mở rộng menu"
            title="Mở rộng menu"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <nav
          className={cn(
            "mt-3 flex flex-1 flex-col gap-1",
            collapsed && "items-center",
          )}
        >
          {visibleNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "nav-item",
                isActive(href) && "nav-item-active",
                collapsed && "w-10 justify-center px-0",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          ))}
        </nav>

        <div
          className={cn(
            "mt-auto space-y-1.5 border-t border-white/20 pt-2.5 dark:border-cold-border",
            collapsed && "flex flex-col items-center",
          )}
        >
          {isGuest && !collapsed && (
            <div className="mx-1.5 flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Khách: {formatTimeLeft(guestTimeLeft)}</span>
            </div>
          )}
          {isGuest && collapsed && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300"
              title={`Khách: ${formatTimeLeft(guestTimeLeft)}`}
            >
              <Clock className="h-3.5 w-3.5" />
            </div>
          )}
          <div
            className={cn(
              "flex items-center gap-2",
              collapsed ? "flex-col px-0" : "px-1.5",
            )}
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt=""
                title={collapsed ? displayName : undefined}
                className="h-7 w-7 shrink-0 rounded-full ring-2 ring-white/50 dark:ring-cold-border"
              />
            ) : (
              <div
                title={collapsed ? displayName : undefined}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-violet-400 via-warm-400 to-rose-400 text-[10px] font-bold text-white"
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-stone-800 dark:text-slate-200">
                  {displayName}
                  {isGuest && (
                    <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400">
                      (khách)
                    </span>
                  )}
                </p>
                <p className="truncate text-[10px] text-stone-400 dark:text-slate-500">
                  {user?.email || "Phiên dùng thử"}
                </p>
              </div>
            )}
          </div>
          <div className={cn("flex gap-1", collapsed && "flex-col")}>
            <button
              type="button"
              onClick={() => {
                primeAudio();
                const next = !soundOn;
                setSoundEnabled(next);
                setSoundOn(next);
              }}
              className={cn(
                "nav-item justify-center px-2",
                collapsed ? "w-10" : "flex-1",
              )}
              aria-label={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
              title={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {soundOn ? (
                <Volume2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-stone-400" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className={cn(
                "nav-item justify-center px-2",
                collapsed ? "w-10" : "flex-1",
              )}
              aria-label="Đổi theme"
              title="Đổi theme"
            >
              <span ref={themeIconRef} className="inline-flex">
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-amber-300" />
                ) : (
                  <Moon className="h-4 w-4 text-warm-500" />
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className={cn(
                "nav-item justify-center px-2 text-red-500 hover:text-red-600",
                collapsed ? "w-10" : "flex-1",
              )}
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <header className="glass fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-3 py-2.5 md:hidden">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-warm-500 dark:text-cold-400" />
          <span className="font-bold">BookFinder</span>
        </div>
        <div className="flex items-center gap-2">
          {isGuest && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {formatTimeLeft(guestTimeLeft)}
            </span>
          )}
          <button type="button" onClick={toggleTheme} className="p-1.5">
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <button type="button" onClick={() => signOut()} className="p-1.5">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <nav className="glass fixed bottom-2 left-2 right-2 z-40 flex justify-around rounded-2xl p-0.5 md:hidden">
        {visibleNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium",
              isActive(href)
                ? "text-warm-600 dark:text-cold-300"
                : "text-stone-500 dark:text-slate-400",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <main
        className={cn(
          "relative z-10 min-h-screen w-full transition-[padding-left] duration-300 ease-out md:pr-2",
          collapsed ? "md:pl-[calc(4.5rem+1rem)]" : "md:pl-[calc(13rem+1rem)]",
        )}
      >
        <div className="min-h-screen pb-16 pt-14 md:pb-3 md:pt-2">
          {children}
        </div>
      </main>
    </div>
  );
}
