import { MINISTRY_SLUGS } from '@/lib/ministries';
import AnnouncementsClient from './AnnouncementsClient';

export const metadata = {
  title: "Announcements | Ministry Dashboard",
  description: "Internal communication and resource sharing for ministry teams."
};

export async function generateStaticParams() {
  return MINISTRY_SLUGS.map(slug => ({ slug }));
}

export default function AnnouncementsPage() {
  return <AnnouncementsClient />;
}
