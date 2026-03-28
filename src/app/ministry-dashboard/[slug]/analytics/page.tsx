import { MINISTRY_SLUGS } from '@/lib/ministries';
import AnalyticsClient from './AnalyticsClient';

export const metadata = {
  title: "Ministry Analytics | Church OS Dashboard",
  description: "Comprehensive performance metrics, attendance trends, and ministry health tracking."
};

/**
 * Next.js Static Export requirement for dynamic segments.
 */
export async function generateStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
