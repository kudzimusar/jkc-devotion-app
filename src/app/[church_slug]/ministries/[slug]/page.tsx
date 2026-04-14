/**
 * Church-scoped ministry detail page.
 * /{church_slug}/ministries/{slug}
 * generateStaticParams covers all org × ministry slug combinations for static export.
 */
import MinistryClient from '@/app/(public)/welcome/ministries/[slug]/MinistryClient';
import { use } from 'react';

// All known ministry slugs — mirrors the list in (public)/welcome/ministries/[slug]/page.tsx
const MINISTRY_SLUGS = [
  'kids-ministry', 'youth-ministry', 'worship-ministry', 'womens-ministry',
  'mens-ministry', 'language-school', 'evangelism', 'prayer', 'media',
  'hospitality', 'missions', 'finance', 'ushers', 'fellowship',
  'fellowship-circles', 'bible-study', 'bible-study-groups', 'akiramenai',
  'food-pantry', 'toyoko-youth-outreach', 'street-evangelism', 'worship',
  'childrens', 'youth', 'pastoral'
];

export async function generateStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function ChurchMinistryPage({ params }: { params: Promise<{ church_slug: string; slug: string }> }) {
  const { slug } = use(params);
  return <MinistryClient slug={slug} />;
}
