/**
 * Church-scoped giving page.
 * /{church_slug}/welcome/give
 * ChurchProvider from [church_slug]/layout.tsx scopes all donation data to the org.
 */
import GiveClient from '@/app/(public)/welcome/give/GiveClient';

export default function ChurchGivePage() {
  return <GiveClient />;
}
