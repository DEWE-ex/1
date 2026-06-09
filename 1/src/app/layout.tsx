import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import GsapProvider from "@/components/providers/GsapProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookFinder",
  description: "Chatbot gợi ý sách với Gemini AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
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
