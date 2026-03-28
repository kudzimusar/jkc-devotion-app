import { MINISTRY_SLUGS } from '@/lib/ministries';
import GroupsClient from './GroupsClient';

export const metadata = {
  title: "Group Management | Ministry Dashboard",
  description: "Advanced oversight for life groups, communities, and specialized ministry circles."
};

/**
 * Next.js Static Export requirement for dynamic segments.
 */
export async function generateStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function GroupsPage() {
  return <GroupsClient />;
}
