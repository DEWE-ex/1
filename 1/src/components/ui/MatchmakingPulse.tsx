"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { matchmakingRadar } from "@/lib/animations";
import { Search } from "lucide-react";

interface MatchmakingPulseProps {
  playerName: string;
  status: "searching" | "matched";
}

export default function MatchmakingPulse({
  playerName,
  status,
}: MatchmakingPulseProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const rings = containerRef.current?.querySelectorAll("[data-ring]");
      if (!rings?.length) return;

      const tl = matchmakingRadar(rings);
      return () => {
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [status] }
  );

  useGSAP(
    () => {
      if (status !== "matched") return;
      gsap.to(containerRef.current, {
        scale: 1.05,
        duration: 0.35,
        ease: "back.out(2)",
      });
    },
    { scope: containerRef, dependencies: [status] }
  );

  return (
    <div ref={containerRef} className="relative mx-auto flex h-28 w-28 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          data-ring
          className="absolute inset-0 rounded-full border-2 border-violet-400/40 dark:border-cold-400/40"
          style={{ opacity: 0.5 - i * 0.12 }}
        />
      ))}
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-rose-500 shadow-glow dark:from-cold-500 dark:to-violet-600 dark:shadow-glow-cold">
        <Search className="h-6 w-6 text-white" />
      </div>
      <p className="absolute -bottom-8 left-1/2 w-max -translate-x-1/2 text-xs text-stone-500 dark:text-slate-400">
        {playerName}
      </p>
    </div>
  );
}
