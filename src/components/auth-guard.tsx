"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            // Check for org membership
            const { data: member, error } = await supabase
                .from("org_members")
                .select("org_id")
                .eq("user_id", user.id)
                .single();

            const hasOrg = !error && member?.org_id;

            if (pathname.startsWith("/onboarding") && hasOrg) {
                router.push("/admin");
            } else if (pathname.startsWith("/admin") && !hasOrg) {
                router.push("/onboarding");
            }

            setLoading(false);
        }

        checkAuth();
    }, [pathname, router]);

    if (loading && (pathname.startsWith("/admin") || pathname.startsWith("/onboarding"))) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <>{children}</>;
}
