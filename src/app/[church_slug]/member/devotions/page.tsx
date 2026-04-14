/**
 * Church-scoped devotion page.
 * Sits under /{church_slug}/member/devotions so the PublicNav/PublicFooter
 * receive the correct org from ChurchProvider (set by [church_slug]/layout.tsx).
 * The DevotionalApp component handles its own auth guard internally.
 */
import DevotionalApp from '@/app/(public)/welcome/devotion/page';

export default function ChurchDevotionsPage() {
  return <DevotionalApp />;
}
