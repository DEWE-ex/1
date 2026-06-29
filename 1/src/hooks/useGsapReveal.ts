"use client";

import { useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { fadeInUp, staggerCards } from "@/lib/animations";

type RevealMode = "fade" | "stagger";

export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(
  mode: RevealMode = "fade",
  deps: unknown[] = []
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (mode === "stagger") {
        const items = el.querySelectorAll("[data-reveal-item]");
        if (!items.length) return;
        staggerCards(items);
      } else {
        fadeInUp(el);
      }
    },
    { dependencies: deps, scope: ref }
  );

  return ref;
}

export function useGsapContext(
  callback: (ctx: gsap.Context) => void,
  deps: unknown[] = []
) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      callback(gsap.context(() => {}, ref));
    },
    { dependencies: deps, scope: ref }
  );

  return ref;
}
