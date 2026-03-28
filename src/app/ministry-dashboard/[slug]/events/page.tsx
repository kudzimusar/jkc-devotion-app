import { MINISTRY_SLUGS } from '@/lib/ministries';
import EventsClient from './EventsClient';

export const metadata = {
  title: "Ministry Events | Dashboard",
  description: "Seamless event planning, registration tracking, and logistical coordination."
};

/**
 * Next.js Static Export requirement for dynamic segments.
 */
export async function generateStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function EventsPageHost() {
  return <EventsClient />;
}
