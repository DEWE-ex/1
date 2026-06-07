"use client";

import { Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import AppShell from "./AppShell";
import LoginScreen from "./LoginScreen";

export default function ShellGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="app-bg" />
        <Sparkles className="relative z-10 h-8 w-8 animate-pulse text-warm-500 dark:text-cold-400" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <AppShell>{children}</AppShell>;
}
