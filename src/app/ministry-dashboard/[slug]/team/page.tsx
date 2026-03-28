import { MINISTRY_SLUGS } from '@/lib/ministries';
import TeamClient from './TeamClient';

export const metadata = {
  title: "Team Management | Ministry Dashboard",
  description: "Comprehensive volunteer coordination, scheduling, and leadership roles."
};

/**
 * Next.js Static Export requirement for dynamic segments.
 */
export async function generateStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function TeamPageHost() {
  return <TeamClient />;
}
