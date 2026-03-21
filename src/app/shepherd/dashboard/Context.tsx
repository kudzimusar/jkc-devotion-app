"use client";
import { createContext, useContext } from "react";
import { AdminRole } from "@/lib/admin-auth";

export interface AdminCtx {
    role: AdminRole;
    userName: string;
    userId: string;
    orgId: string;
    alertCount: number;
    refreshDashboard: () => void;
}

export const AdminContext = createContext<AdminCtx>({
    role: 'admin', userName: 'Admin', userId: '', orgId: '', alertCount: 0,
    refreshDashboard: () => { }
});

export const useAdminCtx = () => useContext(AdminContext);
