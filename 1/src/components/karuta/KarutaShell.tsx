"use client";

import { useGsapReveal } from "@/hooks/useGsapReveal";

type KarutaShellSize = "default" | "lobby" | "wide";

interface KarutaShellProps {
  children: React.ReactNode;
  size?: KarutaShellSize;
  /** @deprecated use size="wide" */
  wide?: boolean;
}

const sizeClass: Record<KarutaShellSize, string> = {
  default: "max-w-md",
  lobby: "max-w-2xl",
  wide: "max-w-2xl",
};

export default function KarutaShell({
  children,
  size,
  wide,
}: KarutaShellProps) {
  const resolved: KarutaShellSize = size ?? (wide ? "wide" : "default");
  const ref = useGsapReveal<HTMLDivElement>("fade");

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-3 py-4 md:min-h-[calc(100dvh-2.5rem)] md:px-4">
      <div ref={ref} className={`w-full ${sizeClass[resolved]}`}>
        {children}
      </div>
    </div>
  );
}
