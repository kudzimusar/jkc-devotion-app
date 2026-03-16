"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { basePath as BP } from "@/lib/utils";

/**
 * Legacy Admin Login Redirect
 * Redirects to the unified login page.
 */
export default function LegacyLoginPage() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace(`${BP}/login/`);
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
