"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAuth } from "@/lib/admin-auth";
import { Loader2 } from "lucide-react";

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      try {
        const session = await AdminAuth.getSession('corporate');
        
        if (!session) {
          router.push("/corporate/login");
          return;
        }

        if (session.auth_surface !== 'console') {
          router.push("/auth/context-selector?domain=corporate");
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error("[SuperAdminGuard] Authorization crash:", error);
        router.push("/corporate/login");
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
