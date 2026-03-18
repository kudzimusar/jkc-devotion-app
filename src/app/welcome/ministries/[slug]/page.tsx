
import MinistryClient from './MinistryClient';
import { use } from 'react';

export async function generateStaticParams() {
  const slugs = [
    'worship', 'ushers', 'childrens', 'youth', 'evangelism', 'prayer', 
    'media', 'hospitality', 'fellowship', 'finance', 'missions', 
    'pastoral', 'akiramenai', 'food-pantry', 'pink-love', 'language-school'
  ];
  return slugs.map(slug => ({ slug }));
}

export default function MinistryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <MinistryClient slug={slug} />;
}
