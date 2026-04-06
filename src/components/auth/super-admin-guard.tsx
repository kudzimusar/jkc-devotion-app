"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAuth } from "@/lib/admin-auth";
import { basePath as BP } from "@/lib/utils";

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    async function checkSuperAdmin() {
      try {
        const session = await AdminAuth.getAdminSession();
        
        if (!session) {
          router.push("/login/");
          return;
        }

        if (session.role !== 'super_admin') {
          console.error("Access denied: Not a super admin");
          router.push("/");
          return;
        }

        setIsSuperAdmin(true);
      } catch (err) {
        console.error("SuperAdminGuard Error:", err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    checkSuperAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return <>{children}</>;
}
