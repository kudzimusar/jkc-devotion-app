"use client";

import { useEffect, useState, ComponentType } from "react";
import { useRouter } from "next/navigation";
import { AdminAuth, AuthDomain, AuthSurface } from "@/lib/admin-auth";
import { Loader2 } from "lucide-react";

export function withDomainGuard<T extends object>(
    Component: ComponentType<T>,
    requiredDomain: AuthDomain,
    requiredSurface?: AuthSurface
) {
    return function DomainGuardedComponent(props: T) {
        const router = useRouter();
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            async function checkAuth() {
                const session = await AdminAuth.getSession(requiredDomain);

                if (!session) {
                    // Not authorized for this domain
                    router.replace(`/${requiredDomain}/login`);
                    return;
                }

                if (requiredSurface && session.auth_surface !== requiredSurface) {
                     // Check if they have another surface in the same domain
                     // For now, redirect to context selector if they mismatch
                     router.replace(`/auth/context-selector?domain=${requiredDomain}`);
                     return;
                }

                setLoading(false);
            }

            checkAuth();
        }, [router]);

        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c14] gap-4">
                    <div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center animate-pulse">
                        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                    </div>
                </div>
            );
        }

        return <Component {...props} />;
    };
}
