import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karuta Online — 1 vs 1",
  description: "Game Karuta 1 đấu 1 online với Firebase Realtime Database",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen font-display">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-karuta-gold/10 via-transparent to-transparent" />
        <main className="relative z-10 mx-auto min-h-screen max-w-4xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
