"use client";
import { Suspense } from "react";
import { useAdminCtx } from "../Context";
import { AdminSettingsPanel } from "@/components/settings/AdminSettingsPanel";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
    const { role, userName, userId, orgId } = useAdminCtx() as any;
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>}>
            <AdminSettingsPanel
                surface="mission-control"
                role={role}
                userName={userName}
                userId={userId}
                orgId={orgId}
            />
        </Suspense>
    );
}
