import { MINISTRY_SLUGS } from '@/lib/ministries';
import ReportsClient from './ReportsClient';

export const metadata = {
  title: "Ministry Reports | Church OS",
  description: "Advanced data submission, spiritual growth reporting, and performance tracking."
};

/**
 * Next.js Static Export requirement for dynamic segments.
 */
export async function generateStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function ReportsPageHost() {
  return <ReportsClient />;
}
