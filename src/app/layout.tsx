import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthGuard } from "@/components/auth-guard";
import { StickyAutoRestorer } from "@/components/utils/StickyAutoRestorer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Church OS",
  description: "Church OS — Multi-tenant church management platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

import ImpersonationBanner from "@/components/super-admin/ImpersonationBanner";
import { ConditionalWidgets } from "@/components/layout/ConditionalWidgets";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen transition-colors duration-500`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ImpersonationBanner />
          <AuthGuard>
            {children}
            <ConditionalWidgets />
          </AuthGuard>
          <StickyAutoRestorer />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
