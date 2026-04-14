"use client";

import { useEffect, useState, ComponentType } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuth, AdminRole } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { basePath as BP } from "@/lib/utils";

/**
 * withRoleGuard Higher Order Component
 * Protects client-side routes in a Static Export environment.
 * 
 * @param Component The component to protect
 * @param allowedRoles Array of roles that can access this component
 */
export function withRoleGuard<T extends object>(
    Component: ComponentType<T>,
    allowedRoles: AdminRole[]
) {
    return function RoleGuardedComponent(props: T) {
        const router = useRouter();
        const pathname = usePathname();
        const [status, setStatus] = useState<{
            loading: boolean;
            authorized: boolean;
        }>({
            loading: true,
            authorized: false
        });

        useEffect(() => {
            async function checkAuth() {
                const session = await AdminAuth.getAdminSession();

                if (!session) {
                    // Not logged in
                    router.replace("/login/");
                    return;
                }

                const isAuthorized = allowedRoles.includes(session.role);

                if (!isAuthorized) {
                    // ... (keep existing redirection logic for unauthorized roles)
                    if (session.role === 'super_admin') {
                        router.replace("/super-admin/");
                    } else if (['pastor', 'owner'].includes(session.role)) {
                        router.replace("/pastor-hq/");
                    } else if (['admin', 'shepherd'].includes(session.role)) {
                        router.replace("/shepherd/dashboard/");
                    } else if (session.role === 'ministry_leader' || session.role === 'ministry_lead') {
                        router.replace("/shepherd/dashboard/");
                    } else {
                        router.replace("/auth/context-selector");
                    }
                    return;
                }

                // MFA ENFORCEMENT — Pastor HQ entry only.
                // Mission Control is freely accessible to pastor/owner/super_admin without aal2.
                // aal2 is only required when entering Pastor HQ from Mission Control (elevation).
                if (['pastor', 'super_admin', 'owner'].includes(session.role)) {
                    let currentPath = pathname;
                    while(currentPath.startsWith(BP)) {
                        currentPath = currentPath.substring(BP.length);
                    }
                    if (!currentPath.startsWith('/')) currentPath = '/' + currentPath;

                    const isPastorHQPath = currentPath.startsWith('/pastor-hq');

                    if (isPastorHQPath) {
                        // Only check aal2 for Pastor HQ paths — and skip if this is a direct entry
                        const isDirect = typeof window !== 'undefined' && sessionStorage.getItem('church_os_phq_direct') === '1';
                        if (!isDirect) {
                            const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                            if (mfaData?.currentLevel !== 'aal2') {
                                if (!currentPath.includes('/settings')) {
                                    router.replace("/pastor-hq/settings?mfa_required=true");
                                    return;
                                }
                            }
                        }
                    }
                    // Mission Control paths: no aal2 check — full tab access for high-authority roles
                }

                setStatus({ loading: false, authorized: true });
            }

            checkAuth();
        }, [router]);

        if (status.loading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
                    <div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center animate-pulse">
                        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                        Verifying Credentials
                    </p>
                </div>
            );
        }

        if (!status.authorized) return null;

        return <Component {...props} />;
    };
}
