interface KarutaCardProps {
  text: string;
  onClick: () => void;
  disabled: boolean;
  highlight?: "correct" | "wrong" | null;
  animationDelay?: number;
}

export default function KarutaCard({
  text,
  onClick,
  disabled,
  highlight,
  animationDelay = 0,
}: KarutaCardProps) {
  const highlightClass =
    highlight === "correct"
      ? "ring-2 ring-emerald-400 bg-emerald-500/10"
      : highlight === "wrong"
        ? "ring-2 ring-red-400 opacity-60"
        : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`animate-card-in glass group relative flex min-h-[96px] items-center justify-center rounded-xl p-3 text-center transition hover:-translate-y-1 hover:shadow-glow active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:shadow-glow-cold ${highlightClass}`}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <p className="text-sm font-medium leading-snug text-stone-800 dark:text-slate-100">
        {text}
      </p>
    </button>
  );
}
