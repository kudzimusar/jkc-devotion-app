"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { basePath as BP } from "@/lib/utils";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    const PUBLIC_PATHS = [
        '/', '/welcome', '/about', '/visit', '/our-pastor',
        '/staff', '/give', '/watch', '/contact',
        '/privacy', '/terms', '/login', '/invite',
        '/merchandise', '/churchgpt'
    ];
    // Normalize pathname by removing ALL occurrences of base path from the start
    let cleanPath = pathname;
    while (cleanPath.startsWith(BP)) {
        cleanPath = cleanPath.substring(BP.length);
    }
    if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
    
    const isPublic = PUBLIC_PATHS.some(p =>
        cleanPath === p || cleanPath.startsWith(`${p}/`)
    );

    useEffect(() => {
        if (isPublic) { 
            setLoading(false); 
            return; 
        }

        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Check for org membership
            const { data: member, error } = await supabase
                .from("org_members")
                .select("org_id, role")
                .eq("user_id", user.id)
                .single();

            const hasOrg = !error && member?.org_id;
            const role = member?.role || 'member';

            // SaaS/API Dashboard logic: Only owners/admins with an ORG can stay in /settings
            if (pathname.startsWith("/settings")) {
                if (!hasOrg) {
                    router.push("/onboarding");
                } else if (role === 'member') {
                    router.push("/");
                }
            }

            // Shepherd Dashboard logic
            if (pathname.startsWith("/shepherd") && !pathname.startsWith("/shepherd/login")) {
                if (role === 'member') {
                    router.push("/");
                }
            }

            // Onboarding logic: If already has an org, go to settings
            if (pathname.startsWith("/onboarding") && hasOrg) {
                router.push("/settings");
            }

            setLoading(false);
        }

        checkAuth();
    }, [pathname, router, isPublic]);

    if (isPublic) return <>{children}</>;

    const isProtected = cleanPath.startsWith("/settings") || 
                       cleanPath.startsWith("/onboarding") || 
                       cleanPath.startsWith("/shepherd") ||
                       cleanPath.startsWith("/pastor-hq") ||
                       cleanPath.startsWith("/super-admin");

    if (loading && isProtected) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <>{children}</>;
}
