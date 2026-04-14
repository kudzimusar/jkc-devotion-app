"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminAuth } from "@/lib/admin-auth";
import { LogOut, User, Settings, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function UserNav() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    }
    getProfile();
  }, []);

  const handleLogout = async () => {
    await AdminAuth.logout();
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("")
    : "??";

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white rounded-xl">
        <Bell className="w-5 h-5" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-xl">
            <Avatar className="h-10 w-10 rounded-xl border border-slate-800">
              <AvatarImage src="" alt={profile?.name} />
              <AvatarFallback className="bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/20">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white dark:bg-slate-900 border-slate-800/50 backdrop-blur-2xl rounded-2xl" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-white">{profile?.name || "Platform Admin"}</p>
              <p className="text-xs leading-none text-slate-400">{profile?.email || "admin@churchos.com"}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-800" />
          <DropdownMenuItem className="focus:bg-slate-800 rounded-lg cursor-pointer text-slate-300">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-slate-800 rounded-lg cursor-pointer text-slate-300" onClick={() => router.push("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-800" />
          <DropdownMenuItem className="focus:bg-red-500/10 focus:text-red-400 rounded-lg cursor-pointer text-red-500" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
