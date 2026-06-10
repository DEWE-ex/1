"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import AdminPanel from "@/components/admin/AdminPanel";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => setAuthenticated(res.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div className="app-bg" />
        <p className="relative z-10 animate-pulse text-stone-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="app-bg" />
      <div className="relative z-10 px-4 py-6">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-stone-500 hover:underline"
        >
          ← Về BookFinder
        </Link>
        {authenticated ? (
          <AdminPanel />
        ) : (
          <AdminLoginForm onSuccess={() => setAuthenticated(true)} />
        )}
      </div>
    </div>
  );
}
