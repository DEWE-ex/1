"use client";

import { memo, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cardFlip, cardRemove } from "@/lib/animations";
import { playKarutaTap } from "@/lib/sounds";

interface KarutaCardProps {
  text: string;
  onClick: () => void;
  disabled: boolean;
  highlight?: "correct" | "wrong" | "removing" | null;
  index?: number;
}

function KarutaCardInner({
  text,
  onClick,
  disabled,
  highlight,
  index = 0,
}: KarutaCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const prevHighlight = useRef(highlight);

  useGSAP(
    () => {
      if (!cardRef.current) return;
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20, rotateX: 8 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          delay: index * 0.05,
          duration: 0.4,
          ease: "power2.out",
        }
      );
    },
    { scope: cardRef, dependencies: [index] }
  );

  useEffect(() => {
    if (!highlight || highlight === prevHighlight.current || !cardRef.current)
      return;
    if (highlight === "removing") {
      cardRemove(cardRef.current);
    } else {
      cardFlip(cardRef.current, highlight);
    }
    prevHighlight.current = highlight;
  }, [highlight]);

  const highlightClass =
    highlight === "correct"
      ? "ring-2 ring-emerald-400 bg-emerald-500/10"
      : highlight === "wrong"
        ? "ring-2 ring-red-400 opacity-60"
        : "";

  const handleClick = () => {
    if (!disabled) playKarutaTap();
    onClick();
  };

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`glass group relative flex min-h-[104px] w-full max-w-[200px] items-center justify-center justify-self-center rounded-xl p-3 text-center transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 will-change-transform dark:hover:shadow-glow-cold ${highlightClass}`}
    >
      <p className="text-sm font-medium leading-snug text-stone-800 dark:text-slate-100">
        {text}
      </p>
    </button>
  );
}

export default memo(KarutaCardInner);
