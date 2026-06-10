"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import AppShell from "./AppShell";
import LoginScreen from "./LoginScreen";
import BookLoading from "@/components/ui/BookLoading";
import { hasSeenOnboarding } from "@/lib/onboarding";

export default function ShellGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authMode, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || authMode === "none") return;
    if (pathname === "/intro") return;
    if (!hasSeenOnboarding()) {
      router.replace("/intro");
    }
  }, [loading, authMode, pathname, router]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="app-bg" />
        <BookLoading label="Đang khởi động..." className="relative z-10" />
      </div>
    );
  }

  if (authMode === "none") return <LoginScreen />;

  if (pathname === "/intro") {
    return (
      <div className="relative min-h-screen">
        <div className="app-bg" />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  if (!hasSeenOnboarding()) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="app-bg" />
        <BookLoading label="Đang chuyển hướng..." className="relative z-10" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
