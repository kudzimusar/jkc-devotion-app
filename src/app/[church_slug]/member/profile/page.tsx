"use client";
/**
 * [church_slug]/member/profile
 * Multi-tenant member profile page.
 * Resolves the church slug to an org_id, verifies the logged-in user
 * belongs to that org, then renders the shared MemberProfileContent component.
 *
 * JKC continues to be served at /profile/ (untouched).
 * All other churches are served here at /[slug]/member/profile/.
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveOrgBySlug } from "@/lib/org-resolver";
import ProfilePage from "@/app/(public)/profile/page";

export default function ChurchMemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const churchSlug = params.church_slug as string;

  const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");

  useEffect(() => {
    async function verify() {
      // 1. Resolve slug → org_id
      const orgId = await resolveOrgBySlug(churchSlug);
      if (!orgId) {
        setStatus("denied");
        return;
      }

      // 2. Check logged-in session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/member/login`);
        return;
      }

      // 3. Confirm user belongs to this org
      const { data: membership } = await supabase
        .from("org_members")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("org_id", orgId)
        .single();

      if (!membership) {
        setStatus("denied");
        return;
      }

      setStatus("authorized");
    }

    verify();
  }, [churchSlug, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">Access denied.</p>
          <p className="text-xs text-muted-foreground">
            You do not have a profile in the <strong>{churchSlug}</strong> church.
          </p>
        </div>
      </div>
    );
  }

  // Authorized — render the shared profile page component
  return <ProfilePage />;
}
