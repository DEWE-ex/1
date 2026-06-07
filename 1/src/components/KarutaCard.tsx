interface KarutaCardProps {
  text: string;
  onClick: () => void;
  disabled: boolean;
  highlight?: "correct" | "wrong" | null;
}

export default function KarutaCard({
  text,
  onClick,
  disabled,
  highlight,
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
      className={`glass group relative flex min-h-[96px] items-center justify-center rounded-xl p-3 text-center transition hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:shadow-glow-cold ${highlightClass}`}
    >
      <p className="text-sm font-medium leading-snug text-stone-800 dark:text-slate-100">
        {text}
      </p>
    </button>
  );
}
