"use client";

import { LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface GuestRestrictedHintProps {
  action: string;
  className?: string;
}

export default function GuestRestrictedHint({
  action,
  className = "",
}: GuestRestrictedHintProps) {
  const { isGuest, signIn } = useAuth();
  if (!isGuest) return null;

  return (
    <p
      className={`flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 ${className}`}
    >
      <LogIn className="h-3.5 w-3.5 shrink-0" />
      <span>
        <button
          type="button"
          onClick={() => signIn()}
          className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
        >
          Đăng nhập Google
        </button>{" "}
        để {action}.
      </span>
    </p>
  );
}
