import MinistryOverviewClient from './MinistryDashboardClient';
import { use } from 'react';

/**
 * Next.js Static Export (SSG) requires pre-defining all dynamic slugs.
 */
export async function generateStaticParams() {
  const slugs = [
    'media',
    'ushers',
    'evangelism',
    'prayer',
    'hospitality',
    'fellowship',
    'finance',
    'missions',
    'pastoral',
    'worship',
    'youth',
    'childrens',
    'akiramenai',
    'food-pantry'
  ];
  return slugs.map(slug => ({ slug }));
}

export default function MinistryOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <MinistryOverviewClient slug={slug} />;
}
