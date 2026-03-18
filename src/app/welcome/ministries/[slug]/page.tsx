
import MinistryClient from './MinistryClient';
import { use } from 'react';

export async function generateStaticParams() {
  const slugs = [
    'kids-ministry', 'youth-ministry', 'worship-ministry', 'womens-ministry', 
    'mens-ministry', 'language-school', 'evangelism', 'prayer', 'media', 
    'hospitality', 'missions', 'finance', 'ushers', 'fellowship',
    'fellowship-circles', 'akiramenai', 'food-pantry', 'toyoko-youth-outreach',
    'street-evangelism', 'worship', 'childrens', 'youth', 'pastoral'
  ];
  return slugs.map(slug => ({ slug }));
}

export default function MinistryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <MinistryClient slug={slug} />;
}
