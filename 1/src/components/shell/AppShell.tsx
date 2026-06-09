"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
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
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/", label: "Chat", icon: MessageSquare },
  { href: "/share", label: "Chia sẻ", icon: Heart },
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
    return pathname.startsWith(href);
  };

  return (
    <div className="relative flex min-h-screen">
      <div className="app-bg" />

      <aside className="glass-sidebar fixed left-3 top-3 z-40 hidden h-[calc(100vh-1.5rem)] w-56 md:flex">
        <div className="flex items-center gap-2 border-b border-white/20 px-2 pb-4 pt-1 dark:border-cold-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-warm-400 to-rose-500">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-900 dark:text-white">
              BookFinder
            </p>
            <p className="text-[10px] text-stone-500 dark:text-slate-400">
              AI + Karuta + Cộng đồng
            </p>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "nav-item",
                isActive(href) && "nav-item-active"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-white/20 pt-3 dark:border-cold-border">
          {isGuest && (
            <div className="mx-2 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Khách: {formatTimeLeft(guestTimeLeft)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-2">
            {photoURL ? (
              <img
                src={photoURL}
                alt=""
                className="h-8 w-8 rounded-full ring-2 ring-white/50 dark:ring-cold-border"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-violet-400 via-warm-400 to-rose-400 text-xs font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
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
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="nav-item flex-1 justify-center px-2"
              aria-label="Đổi theme"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-amber-300" />
              ) : (
                <Moon className="h-4 w-4 text-warm-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="nav-item flex-1 justify-center px-2 text-red-500 hover:text-red-600"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <header className="glass fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-warm-500 dark:text-cold-400" />
          <span className="font-bold">BookFinder</span>
        </div>
        <div className="flex items-center gap-2">
          {isGuest && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {formatTimeLeft(guestTimeLeft)}
            </span>
          )}
          <button type="button" onClick={toggleTheme} className="p-2">
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <button type="button" onClick={() => signOut()} className="p-2">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <nav className="glass fixed bottom-3 left-3 right-3 z-40 flex justify-around rounded-2xl p-1 md:hidden">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium",
              isActive(href)
                ? "text-warm-600 dark:text-cold-300"
                : "text-stone-500 dark:text-slate-400"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      <main className="relative z-10 min-h-screen w-full md:pl-[calc(14rem+1.5rem)]">
        <div className="min-h-screen pb-20 pt-16 md:pb-4 md:pt-3 md:pr-3">
          {children}
        </div>
      </main>
    </div>
  );
}
