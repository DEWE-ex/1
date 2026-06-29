import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import GsapProvider from "@/components/providers/GsapProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BFinder",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: ["/favicon.png"],
    apple: [{ url: "/favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head></head>

      <body>
        <ThemeProvider>
          <AuthProvider>
            <GsapProvider>{children}</GsapProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}