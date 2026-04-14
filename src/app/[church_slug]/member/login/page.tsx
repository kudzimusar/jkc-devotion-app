/**
 * Church-scoped member login page.
 * URL: /{church_slug}/member/login
 * ChurchProvider (from [church_slug]/layout.tsx) seeds the org into context
 * so BaseAuthMember can read it and redirect back to the right church routes.
 */
import { BaseAuthMember } from "@/components/auth/BaseAuth";

export default function ChurchMemberLoginPage() {
  return <BaseAuthMember />;
}
