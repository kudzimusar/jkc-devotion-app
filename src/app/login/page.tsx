"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminAuth } from "@/lib/admin-auth";
import { Loader2 } from "lucide-react";

/**
 * Legacy Login Redirector
 * Transitions users from the legacy unified login to domain-specific entry points.
 */
export default function LegacyLoginPage() {
    const router = useRouter();

    useEffect(() => {
        async function handleResolution() {
            const session = await AdminAuth.getSession();
            if (session) {
                // If they are logged in, send them to context selector to choose where to go
                router.replace("/auth/context-selector");
            } else {
                // If not logged in, redirect to the default church login
                router.replace("/church/login");
            }
        }
        handleResolution();
    }, [router]);

    return (
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                    Redirecting to Secure Gateway
                </p>
            </div>
        </div>
    );
}
