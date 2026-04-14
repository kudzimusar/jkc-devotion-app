/**
 * [church_slug] layout
 * Root layout for all multi-tenant church routes.
 * generateStaticParams pre-renders all active org slugs at build time.
 * When a new church is onboarded and their org is set to active,
 * trigger a new GitHub Actions build to include their slug.
 */
import { supabase } from "@/lib/supabase";

export async function generateStaticParams() {
  const { data, error } = await supabase
    .from("organizations")
    .select("church_slug")
    .eq("status", "active");

  if (error) {
    console.error("[generateStaticParams] Failed to fetch org slugs:", error.message);
    // Fallback: return known slugs so build never fails completely
    return [
      { church_slug: "jkc-devotion-app" },
      { church_slug: "grace-fellowship" },
      { church_slug: "grace-fellowship-ai" },
      { church_slug: "test-osaka" },
      { church_slug: "test-tokyo" },
      { church_slug: "test-church" },
      { church_slug: "corporate" },
    ];
  }

  return data?.map((org) => ({ church_slug: org.church_slug })) ?? [];
}

export default function ChurchSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
