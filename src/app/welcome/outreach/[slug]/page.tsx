
import OutreachDetailClient from './OutreachDetailClient';
import { use } from 'react';

export async function generateStaticParams() {
  const slugs = [
    'toyoko-youth-outreach',
    'akiramenai',
    'food-pantry',
    'street-evangelism',
  ];
  return slugs.map(slug => ({ slug }));
}

export default function OutreachDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <OutreachDetailClient slug={slug} />;
}
