import { ThemeProvider } from "@/components/theme-provider";
import { Manrope, Inter } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["200", "400", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "600"],
});

import { SessionExpiryWarning } from '@/components/onboarding/SessionExpiryWarning';
import SessionHeartbeatWrapper from '@/components/onboarding/SessionHeartbeatWrapper';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="onboarding-theme relative min-h-screen selection:bg-[#72eff5]/30">
        <SessionHeartbeatWrapper />
        <SessionExpiryWarning />
        {children}
    </div>
  );
}
