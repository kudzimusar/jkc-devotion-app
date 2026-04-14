/**
 * Church-scoped about page.
 * /{church_slug}/welcome/about
 * AboutClient reads org context from useChurch() for dynamic branding.
 */
import AboutClient from '@/app/(public)/welcome/about/AboutClient';

export default function ChurchAboutPage() {
  return <AboutClient />;
}
