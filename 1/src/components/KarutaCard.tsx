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
      ? "ring-4 ring-green-500 bg-green-50"
      : highlight === "wrong"
        ? "ring-4 ring-red-400 bg-red-50 opacity-60"
        : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex min-h-[100px] items-center justify-center rounded-xl border-2 border-karuta-wood/30 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-center shadow-md transition hover:-translate-y-1 hover:border-karuta-red hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${highlightClass}`}
    >
      <div className="absolute left-2 top-2 h-3 w-3 rounded-full bg-karuta-red/60" />
      <p className="text-sm font-medium leading-snug text-karuta-ink md:text-base">
        {text}
      </p>
    </button>
  );
}
