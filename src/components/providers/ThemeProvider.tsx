"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { themeCrossfade } from "@/lib/animations";

interface ThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDarkMode: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(dark);
    if (dark) document.documentElement.classList.add("dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || animatingRef.current) return;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode, mounted]);

  const applyTheme = useCallback((dark: boolean) => {
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    if (animatingRef.current || !overlayRef.current) return;
    animatingRef.current = true;

    const goingDark = !isDarkMode;
    const overlay = overlayRef.current;
    overlay.style.background = goingDark ? "#0a0f1a" : "#fffbf5";

    document.documentElement.classList.add("theme-transitioning");
    themeCrossfade(overlay, () => applyTheme(goingDark)).eventCallback(
      "onComplete",
      () => {
        animatingRef.current = false;
        document.documentElement.classList.remove("theme-transitioning");
      }
    );
  }, [isDarkMode, applyTheme]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <div
        ref={overlayRef}
        aria-hidden
        className="theme-flash-overlay pointer-events-none fixed inset-0 z-[200] opacity-0"
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
