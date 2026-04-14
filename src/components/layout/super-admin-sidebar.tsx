"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Church,
  CreditCard,
  BarChart3,
  Bot,
  Settings,
  ShieldAlert,
  Users,
  Database,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const menuItems = [
  {
    title: "Overview",
    href: "/super-admin",
    icon: LayoutDashboard,
  },
  {
    title: "Churches (Tenants)",
    href: "/super-admin/tenants",
    icon: Church,
  },
  {
    title: "Subscriptions",
    href: "/super-admin/billing",
    icon: CreditCard,
  },
  {
    title: "Analytics",
    href: "/super-admin/analytics",
    icon: BarChart3,
  },
  {
    title: "AI Ops",
    href: "/super-admin/ai-ops",
    icon: Bot,
  },
  {
    title: "Platform Broadcast",
    href: "/super-admin/ai-ops/broadcast",
    icon: Megaphone,
  },
  {
    title: "Staff & RBAC",
    href: "/super-admin/staff",
    icon: Users,
  },
  {
    title: "Audit Logs",
    href: "/super-admin/audit",
    icon: Database,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col border-r border-slate-800/50 bg-slate-900/40 backdrop-blur-2xl", className)}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Church OS</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] mb-4 ml-2">
          Platform Management
        </div>
        
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group duration-300",
              pathname === item.href
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4 transition-transform group-hover:scale-110",
              pathname === item.href ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
            )} />
            {item.title}
            {pathname === item.href && (
              <div className="ml-auto w-1 h-4 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            )}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800/50">
        <Link
          href="/corporate/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all group"
        >
          <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          Return to Settings
        </Link>
      </div>
    </div>
  );
}
