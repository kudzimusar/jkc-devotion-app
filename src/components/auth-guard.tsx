"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuth } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

/**
 * Domain-Aware Auth Guard
 * Enforces strict boundaries between Corporate, Onboarding, Tenant, and Member domains.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    const PUBLIC_PATHS = [
        '/', '/welcome', '/about', '/visit', '/our-pastor',
        '/staff', '/give', '/watch', '/contact',
        '/privacy', '/terms', '/invite',
        '/merchandise', '/churchgpt'
    ];
    
    // Normalize and check if path is in a restricted domain
    const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`));
    const isLogin = pathname.includes('/login');

    useEffect(() => {
        if (isPublic && !isLogin) { 
            setLoading(false); 
            return; 
        }

        async function checkDomainIsolation() {
            // Determine required domain based on URL
            let requiredDomain: 'corporate' | 'tenant' | 'onboarding' | 'member' | null = null;

            if (pathname.startsWith("/super-admin") || pathname.startsWith("/corporate")) {
                requiredDomain = 'corporate';
            } else if (pathname.startsWith("/pastor-hq") || pathname.startsWith("/shepherd") || pathname.startsWith("/church") || pathname.startsWith("/ministry")) {
                requiredDomain = 'tenant';
            } else if (pathname.startsWith("/onboarding")) {
                requiredDomain = 'onboarding';
            } else if (pathname.startsWith("/member")) {
                requiredDomain = 'member';
            }

            if (!requiredDomain) {
                setLoading(false);
                return;
            }

            // Check if user is authenticated with Supabase at all
            const { data: { session: sbSession } } = await supabase.auth.getSession();

            // If no Supabase session and not on login page, redirect
            if (!sbSession && !isLogin) {
                const loginMap: Record<string, string> = {
                    'corporate': '/corporate/login',
                    'tenant': '/church/login',
                    'onboarding': '/onboarding/login',
                    'member': '/member/login'
                };
                router.replace(loginMap[requiredDomain] || "/");
                return;
            }

            // If on login page, allow it (no domain check needed)
            if (isLogin) {
                setLoading(false);
                return;
            }

            // User is authenticated with Supabase, now check domain context
            const session = await AdminAuth.getSession(requiredDomain);

            if (!session) {
                // Try without domain filter as fallback
                const anySession = await AdminAuth.getSession();
                if (!anySession) {
                    // No session in any domain, redirect to login
                    const loginMap: Record<string, string> = {
                        'corporate': '/corporate/login',
                        'tenant': '/church/login',
                        'onboarding': '/onboarding/login',
                        'member': '/member/login'
                    };
                    router.replace(loginMap[requiredDomain] || "/");
                    return;
                }
                // Has session but wrong domain - redirect to context selector
                router.replace("/auth/context-selector?domain=" + requiredDomain);
                return;
            }

            // Enforce surface boundaries if logged in
            if (session && !isLogin) {
                if (pathname.startsWith("/pastor-hq") && session.auth_surface !== 'pastor-hq') {
                    router.replace("/auth/context-selector?domain=tenant");
                    return;
                }
                if (pathname.startsWith("/shepherd") && (session.auth_surface !== 'mission-control' && session.auth_surface !== 'ministry')) {
                    // Exception: Permit pastor-hq to access settings for MFA compliance
                    if (pathname.startsWith("/shepherd/dashboard/settings") && session.auth_surface === 'pastor-hq') {
                        // Allow access
                    } else {
                        router.replace("/auth/context-selector?domain=tenant");
                        return;
                    }
                }
            }

            setLoading(false);
        }

        checkDomainIsolation();
    }, [pathname, router, isPublic, isLogin]);

    if (loading && !isPublic) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
