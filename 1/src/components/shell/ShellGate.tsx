"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import AppShell from "./AppShell";
import LoginScreen from "./LoginScreen";
import OnboardingModal from "./OnboardingModal";
import BookLoading from "@/components/ui/BookLoading";
import { hasSeenOnboarding } from "@/lib/onboarding";

export default function ShellGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authMode, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (authMode !== "none") {
      setShowOnboarding(!hasSeenOnboarding());
      setOnboardingChecked(true);
    }
  }, [authMode]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="app-bg" />
        <BookLoading label="Đang khởi động..." className="relative z-10" />
      </div>
    );
  }

  if (authMode === "none") return <LoginScreen />;

  return (
    <>
      {showOnboarding && onboardingChecked && (
        <OnboardingModal onDone={() => setShowOnboarding(false)} />
      )}
      <AppShell>{children}</AppShell>
    </>
  );
}
