import MinistryOverviewClient from './MinistryDashboardClient';
import { use } from 'react';

import { MINISTRY_SLUGS } from '@/lib/ministries';

/**
 * Next.js Static Export (SSG) requires pre-defining all dynamic slugs.
 */
export async function generateStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function MinistryOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <MinistryOverviewClient slug={slug} />;
}
